'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart4, 
  Flame, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  Users,
  Info,
  ChevronRight
} from 'lucide-react';
import { isDemoMode } from '@/lib/demo-mode';

interface HeatmapRow {
  skillId: string;
  skillName: string;
  dayId: string;
  masteredPct: number;    // 🟢 %
  learningPct: number;    // 🟡 %
  weakPct: number;        // 🔴 %
  notStartedPct: number;  // ⚪ %
}

// Generate mock heatmap distribution based on class progress
const MOCK_HEATMAP: HeatmapRow[] = [
  {
    skillId: 'transformer-foundations',
    skillName: 'Transformer & LLM Foundations',
    dayId: 'Day 1',
    masteredPct: 75,
    learningPct: 15,
    weakPct: 5,
    notStartedPct: 5
  },
  {
    skillId: 'ai-problem-formulation',
    skillName: 'Định hình bài toán AI',
    dayId: 'Day 2',
    masteredPct: 60,
    learningPct: 30,
    weakPct: 5,
    notStartedPct: 5
  },
  {
    skillId: 'data-eval-strategy',
    skillName: 'Đo lường & Chiến lược dữ liệu',
    dayId: 'Day 2',
    masteredPct: 45,
    learningPct: 35,
    weakPct: 15,
    notStartedPct: 5
  },
  {
    skillId: 'react-loop-foundations',
    skillName: 'Vòng lặp ReAct Agent',
    dayId: 'Day 3',
    masteredPct: 35,
    learningPct: 40,
    weakPct: 15,
    notStartedPct: 10
  },
  {
    skillId: 'agent-security-debug',
    skillName: 'Bảo mật & Debug Agent',
    dayId: 'Day 3',
    masteredPct: 10,
    learningPct: 30,
    weakPct: 55, // Critical alert!
    notStartedPct: 5
  },
  {
    skillId: 'context-engineering',
    skillName: 'Context Engineering & JIT',
    dayId: 'Day 4',
    masteredPct: 15,
    learningPct: 45,
    weakPct: 30,
    notStartedPct: 10
  },
  {
    skillId: 'tool-calling-execution',
    skillName: 'Tool Calling & Secure Execution',
    dayId: 'Day 4',
    masteredPct: 8,
    learningPct: 42,
    weakPct: 40, // High alert
    notStartedPct: 10
  },
  {
    skillId: 'ai-uncertainty-design',
    skillName: 'Thiết kế UX/UI cho sự bất định',
    dayId: 'Day 5',
    masteredPct: 0,
    learningPct: 20,
    weakPct: 15,
    notStartedPct: 65
  },
  {
    skillId: 'roi-risk-management',
    skillName: 'Đánh giá rủi ro & Tối ưu ROI',
    dayId: 'Day 5',
    masteredPct: 0,
    learningPct: 15,
    weakPct: 10,
    notStartedPct: 75
  },
  {
    skillId: 'embedding-vector-stores',
    skillName: 'Embedding & Vector Stores',
    dayId: 'Day 7',
    masteredPct: 0,
    learningPct: 5,
    weakPct: 5,
    notStartedPct: 90
  },
  {
    skillId: 'rag-pipelines',
    skillName: 'RAG Pipelines & Hybrid Search',
    dayId: 'Day 8',
    masteredPct: 0,
    learningPct: 0,
    weakPct: 0,
    notStartedPct: 100
  }
];

export const BtcHeatmap: React.FC = () => {
  const demoMode = isDemoMode();
  const [data] = useState<HeatmapRow[]>(demoMode ? MOCK_HEATMAP : []);
  const [workshopStatus, setWorkshopStatus] = useState<string | null>(null);
  
  // Find the skill with the highest WEAK (🔴) percentage as critical
  const initialCriticalSkill = [...data].sort((a, b) => b.weakPct - a.weakPct)[0];
  const [criticalSkill] = useState<HeatmapRow | null>(
    initialCriticalSkill && initialCriticalSkill.weakPct > 30 ? initialCriticalSkill : null
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 md:py-6 px-4 font-be-vietnam-pro">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-border pb-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-green">
            <BarChart4 className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-sm md:text-md font-black text-on-background uppercase tracking-tight font-fraunces">Macro Course Heatmap</h2>
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] font-black text-stone-500 bg-surface-container-low px-3 py-1.5 rounded-xl border border-gray-border uppercase tracking-widest font-mono">
          <Users className="w-3.5 h-3.5 text-primary-green" />
          <span>Khóa K2 • 120 Học viên</span>
        </div>
      </div>

      {demoMode ? (
        <div className="bg-gradient-to-r from-primary-green/20 via-primary-green/5 to-tertiary-yellow/10 border border-primary-green/15 rounded-2xl px-4 py-2.5 mb-6 flex items-center justify-between text-xs text-primary-green-dark font-medium shadow-sm">
          <span className="flex items-center gap-1.5 font-bold">
            <BarChart4 className="w-4.5 h-4.5 text-primary-green shrink-0" />
            <span>Dữ liệu mẫu: dùng để minh họa cách giảng viên phát hiện nhóm cần hỗ trợ.</span>
          </span>
          <span className="text-[9px] font-black uppercase bg-primary-green/20 border border-primary-green-dark/30 px-2 py-0.5 rounded font-mono">Dữ liệu mẫu</span>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border-2 border-stone-200 bg-white p-5 text-sm font-bold text-stone-600">
          Chưa có endpoint dữ liệu heatmap khóa học. Màn hình production không hiển thị số liệu mô phỏng.
        </div>
      )}

      {/* Course Health Warning Banner */}
      {criticalSkill && (
        <section className="mb-6 bg-red-50 border-2 border-error-red/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-left">
          <div className="space-y-1.5">
            <h3 className="text-xs font-black text-error-red-dark uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-error-red-dark animate-bounce" />
              Cảnh Báo Hệ Thống: Cải tiến Giáo án khẩn cấp
            </h3>
            <p className="text-xs text-stone-700 font-semibold leading-relaxed max-w-2xl">
              Phát hiện <span className="font-extrabold text-error-red-dark">{criticalSkill.weakPct}% học viên toàn khóa</span> đang rơi vào trạng thái <span className="font-extrabold text-error-red-dark">🔴 Cần ôn tập</span> đối với kỹ năng <span className="font-extrabold text-stone-900">&ldquo;{criticalSkill.skillName}&rdquo; ({criticalSkill.dayId})</span>.
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setWorkshopStatus('Đã ghi nhận yêu cầu workshop. Mentor sẽ kiểm tra lịch và xác nhận trong dashboard lớp.')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-error-red border border-error-red-dark text-white rounded-xl text-xs font-extrabold hover:bg-error-red-dark cursor-pointer active:translate-y-[1px] shadow-sm transition-colors"
            >
              <Flame className="w-4 h-4" />
              <span>Tổ chức Workshop bổ trợ</span>
            </button>
            {workshopStatus && (
              <p className="mt-2 max-w-[14rem] text-[11px] font-bold leading-5 text-error-red-dark" role="status">
                {workshopStatus}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Heatmap Matrix list */}
      <section className="bg-white border-2 border-gray-border rounded-3xl p-6 shadow-sm text-left space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-150 pb-4">
          <div>
            <h3 className="font-fraunces font-black text-sm text-on-background">Biểu đồ nhiệt năng lực toàn lớp</h3>
            <p className="text-[10px] text-stone-400 font-semibold mt-0.5 leading-relaxed">
              Tỷ lệ phần trăm phân bố trạng thái năng lực học viên theo từng Kỹ năng.
            </p>
          </div>
          
          {/* Legend indicator */}
          <div className="flex flex-wrap gap-3 text-[9px] font-black text-stone-500 uppercase tracking-wider font-mono">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary-green" /> Thành thạo</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-tertiary-yellow" /> Đang học</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-error-red" /> Cần ôn tập</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-stone-200" /> Chưa học</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-4">
          {data.map((row) => (
            <div 
              key={row.skillId}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:bg-stone-50 rounded-2xl border border-stone-100 transition-all"
            >
              {/* Skill label */}
              <div className="w-full md:w-64 shrink-0">
                <span className="text-[9px] font-black font-mono text-stone-400 uppercase tracking-wider">{row.dayId}</span>
                <h4 className="font-extrabold text-xs text-on-background leading-tight mt-0.5">{row.skillName}</h4>
              </div>

              {/* Stacked Progress Bar */}
              <div className="flex-1 h-7 rounded-xl border border-stone-250 overflow-hidden flex shadow-inner relative">
                {row.masteredPct > 0 && (
                  <div 
                    className="bg-primary-green hover:brightness-105 transition-all flex items-center justify-center text-[9px] font-black text-white font-mono"
                    style={{ width: `${row.masteredPct}%` }}
                    title={`Thành thạo: ${row.masteredPct}%`}
                  >
                    {row.masteredPct >= 8 && `${row.masteredPct}%`}
                  </div>
                )}
                {row.learningPct > 0 && (
                  <div 
                    className="bg-tertiary-yellow hover:brightness-105 transition-all flex items-center justify-center text-[9px] font-black text-white font-mono"
                    style={{ width: `${row.learningPct}%` }}
                    title={`Đang học: ${row.learningPct}%`}
                  >
                    {row.learningPct >= 8 && `${row.learningPct}%`}
                  </div>
                )}
                {row.weakPct > 0 && (
                  <div 
                    className="bg-error-red hover:brightness-105 transition-all flex items-center justify-center text-[9px] font-black text-white font-mono"
                    style={{ width: `${row.weakPct}%` }}
                    title={`Cần ôn tập: ${row.weakPct}%`}
                  >
                    {row.weakPct >= 8 && `${row.weakPct}%`}
                  </div>
                )}
                {row.notStartedPct > 0 && (
                  <div 
                    className="bg-stone-200 hover:brightness-105 transition-all flex items-center justify-center text-[9px] font-black text-stone-400 font-mono"
                    style={{ width: `${row.notStartedPct}%` }}
                    title={`Chưa học: ${row.notStartedPct}%`}
                  >
                    {row.notStartedPct >= 8 && `${row.notStartedPct}%`}
                  </div>
                )}
              </div>

              {/* Insights */}
              <div className="hidden lg:flex items-center gap-1 text-[10px] font-black uppercase text-stone-400 font-mono">
                {row.weakPct > 35 ? (
                  <span className="text-error-red">Nguy cơ tụt hậu</span>
                ) : row.masteredPct > 50 ? (
                  <span className="text-primary-green-dark">Chất lượng tốt</span>
                ) : (
                  <span>Đúng tiến độ</span>
                )}
              </div>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
};
