import React from "react";
import { ClipboardText, CaretDown } from "@phosphor-icons/react";
import { LearningPathHistoryItem } from "@/lib/learning-path-api";

interface HistorySelectorProps {
  history: LearningPathHistoryItem[];
  selectedId: string | null;
  onSelect: (instanceId: string) => void;
}

export function HistorySelector({ history, selectedId, onSelect }: HistorySelectorProps) {
  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "midterm":
        return "Lộ trình sau thi Giữa kỳ";
      case "final":
        return "Lộ trình sau thi Cuối kỳ";
      default:
        return "Lộ trình cá nhân hóa";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="history-selector-wrapper">
      <div className="selector-trigger">
        <ClipboardText size={18} weight="fill" />
        <select
          value={selectedId || ""}
          onChange={(e) => onSelect(e.target.value)}
          className="history-select-dropdown"
        >
          {history.map((item) => (
            <option key={item.instance_id} value={item.instance_id}>
              {getTriggerLabel(item.trigger_type)} ({formatDate(item.created_at)})
            </option>
          ))}
        </select>
        <CaretDown size={14} weight="bold" className="dropdown-arrow" />
      </div>
    </div>
  );
}
