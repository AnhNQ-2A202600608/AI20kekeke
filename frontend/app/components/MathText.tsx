import styles from "./math-text.module.css";

type FractionProps = {
  numerator: string;
  denominator: string;
};

type MathTextProps = {
  value: string;
  className?: string;
};

const FRACTION_TOKEN = /^(\d+)\/(\d+)$/;

export function Fraction({ numerator, denominator }: FractionProps) {
  return (
    <span className={styles.mathFraction} role="math" aria-label={numerator + " trên " + denominator}>
      <span>{numerator}</span>
      <span>{denominator}</span>
    </span>
  );
}

export function MathText({ value, className }: MathTextProps) {
  return (
    <span className={[styles.mathText, className].filter(Boolean).join(" ")}>
      {value.split(/(\d+\/\d+)/g).map((token, index) => {
        const match = token.match(FRACTION_TOKEN);

        if (!match) return token;

        return <Fraction key={token + "-" + index} numerator={match[1]} denominator={match[2]} />;
      })}
    </span>
  );
}
