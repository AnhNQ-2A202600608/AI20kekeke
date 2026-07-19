import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { CheckCircle, LockKey, Sparkle } from "@phosphor-icons/react";
import { Milestone } from "@/lib/learning-path-api";

export const MilestoneNode = memo(({ data }: { data: { milestone: Milestone; selected: boolean } }) => {
  const m = data.milestone;
  const status = m.status;

  return (
    <div className={`graph-node adaptive-node ${status} ${data.selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      
      <div className="node-content">
        <div className="node-icon">
          {status === "completed" ? (
            <CheckCircle size={18} weight="fill" className="text-success" />
          ) : status === "locked" ? (
            <LockKey size={16} className="text-muted" />
          ) : (
            <Sparkle size={16} weight="fill" className="text-accent animate-pulse" />
          )}
        </div>
        
        <div className="node-details">
          <div className="node-title">{m.concept_name}</div>
          {m.error_type && (
            <span className={`node-error-tag ${m.error_type}`}>
              {m.error_type === "careless" ? "Bất cẩn" : "Hổng kiến thức"}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
});

MilestoneNode.displayName = "MilestoneNode";
