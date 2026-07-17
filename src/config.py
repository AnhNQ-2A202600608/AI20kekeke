import string
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)

# Load environment variables from root .env file
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")


class ScaffoldingRule(BaseModel):
    min_elo: float
    max_elo: float
    instructions: str


class AlgorithmConfig(BaseModel):
    scaffolding_rules: list[ScaffoldingRule]
    mode_instructions: dict[str, str]


class EvolInstructInDepth(BaseModel):
    add_constraints: str
    deepening: str
    concretizing: str
    increase_reasoning: str
    complicate_input: str


class EvolInstructElimination(BaseModel):
    equal_check: str
    difficulty_judge: str


class EvolInstructPrompts(BaseModel):
    in_depth: EvolInstructInDepth
    in_breadth: str
    elimination: EvolInstructElimination
    generate_quiz: str


class PromptsConfig(BaseModel):
    system_prompt: str
    evol_instruct: EvolInstructPrompts | None = None
    generate_quizzes_from_slides: str | None = None
    generate_socratic_hints: str | None = None

    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt_placeholders(cls, v: str) -> str:
        expected_keys = {
            "student_elo",
            "student_bkt",
            "student_weakness",
            "active_quiz_session",
            "scaffolding_rules",
            "mode_instructions",
            "context",
        }
        try:
            formatter = string.Formatter()
            parsed_fields = {field_name for _, field_name, _, _ in formatter.parse(v) if field_name is not None}
            missing_fields = expected_keys - parsed_fields
            if missing_fields:
                raise ValueError(f"System prompt is missing required placeholder variables: {missing_fields}")
        except Exception as e:
            raise ValueError(f"Invalid format string or placeholder check failed: {e}")
        return v


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "AI20K Agent"
    app_env: Literal["development", "production", "staging", "test"] = "development"
    app_port: int = Field(default=8000, ge=1, le=65535)
    app_host: str = "0.0.0.0"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    cors_origins: str = "http://localhost:3000"

    # LLM
    openai_api_key: str = ""
    model_name: str = "gpt-4o-mini"
    llm_temperature: float = Field(default=0.7, ge=0.0, le=2.0)

    # Database
    database_url: str = "sqlite:///./data/app.db"

    # Cache
    cache_type: Literal["in_memory", "redis"] = "in_memory"
    redis_url: str = "redis://localhost:6379/0"
    redis_token: str = ""

    # Vector Store
    chroma_persist_dir: str = "./data/chroma"

    # OCR / PDF Ingestion Pipeline settings
    sgk_data_dir: str = "./data"
    ocr_lang: str = "vie"
    ocr_dpi: int = 300
    ocr_min_chars_per_page: int = 40
    tesseract_cmd: str = ""
    rag_chunk_chars: int = 1200
    rag_chunk_overlap_chars: int = 200
    rag_top_k: int = 5

    # Prompts & Algorithm configs loaded from yaml files
    prompts: PromptsConfig | None = None
    algorithm: AlgorithmConfig | None = None

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        class YamlConfigSettingsSource(PydanticBaseSettingsSource):
            def __call__(self) -> dict[str, Any]:
                config_dir = Path(__file__).parent.parent / "config"
                settings_path = config_dir / "settings.yaml"
                yaml_data = {}
                if settings_path.exists():
                    with open(settings_path, encoding="utf-8") as f:
                        data = yaml.safe_load(f) or {}
                        # Flatten settings.yaml structure
                        if "app" in data:
                            app_data = data["app"]
                            yaml_data["app_name"] = app_data.get("name")
                            yaml_data["app_env"] = app_data.get("env")
                            yaml_data["app_port"] = app_data.get("port")
                            yaml_data["app_host"] = app_data.get("host")
                            yaml_data["log_level"] = app_data.get("log_level")
                            yaml_data["cors_origins"] = app_data.get("cors_origins")
                        if "llm" in data:
                            llm_data = data["llm"]
                            yaml_data["model_name"] = llm_data.get("model_name")
                            yaml_data["llm_temperature"] = llm_data.get("llm_temperature")
                        if "database" in data:
                            db_data = data["database"]
                            yaml_data["database_url"] = db_data.get("database_url")
                        if "cache" in data:
                            cache_data = data["cache"]
                            yaml_data["cache_type"] = cache_data.get("cache_type")
                            yaml_data["redis_url"] = cache_data.get("redis_url")
                            yaml_data["redis_token"] = cache_data.get("redis_token")
                        if "vector_store" in data:
                            vs_data = data["vector_store"]
                            yaml_data["chroma_persist_dir"] = vs_data.get("chroma_persist_dir")

                # Load prompts.yaml
                prompts_path = config_dir / "prompts.yaml"
                if prompts_path.exists():
                    with open(prompts_path, encoding="utf-8") as f:
                        p_data = yaml.safe_load(f) or {}
                        if "prompts" in p_data:
                            yaml_data["prompts"] = p_data["prompts"]

                # Load algorithm.yaml
                algorithm_path = config_dir / "algorithm.yaml"
                if algorithm_path.exists():
                    with open(algorithm_path, encoding="utf-8") as f:
                        a_data = yaml.safe_load(f) or {}
                        yaml_data["algorithm"] = a_data

                # Filter out None values
                return {k: v for k, v in yaml_data.items() if v is not None}

            def get_field_value(self, field: Any, field_name: str) -> tuple[Any, str, bool]:
                return None, field_name, False

        return (
            init_settings,
            env_settings,
            dotenv_settings,
            YamlConfigSettingsSource(settings_cls),
        )

    @property
    def sgk_data_path(self) -> Path:
        p = Path(self.sgk_data_dir).expanduser()
        if not p.is_absolute():
            p = Path(__file__).resolve().parent.parent / p
        return p

    @property
    def raw_pdf_dir(self) -> Path:
        p = self.sgk_data_path
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def processed_dir(self) -> Path:
        p = self.sgk_data_path / "processed"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def rag_index_dir(self) -> Path:
        p = self.sgk_data_path / "rag_index"
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()
