"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import { AppShell, LevelBadge, ProgressBar } from "../components/AppShell";

type DifficultySubItem = {
  id: string; // "NB" | "TH" | "VD"
  title: string; // "Nhận biết" | "Thông hiểu" | "Vận dụng"
  level: "beginner" | "intermediate" | "advanced";
  detail: string;
  state: string; // "done" | "current"
  progress: number;
};

type LessonGroup = {
  id: string; // e.g. "B1", "B2"
  title: string;
  progress: number;
  state: string;
  difficulties: DifficultySubItem[];
};

type ChapterContent = {
  title: string;
  overline: string;
  summary: string;
  xp: number;
  lessonsCount: number;
  progress: number;
  lessons: LessonGroup[];
};

const chaptersContent: Record<string, ChapterContent> = {
  "01": {
    title: "Tập hợp các số tự nhiên",
    overline: "Toán học lớp 6 · Chương I",
    summary: "Tập hợp, cách ghi số tự nhiên, các phép tính và lũy thừa.",
    xp: 1400,
    lessonsCount: 7,
    progress: 0,
    lessons: [
      {
        id: "B1",
        title: "Bài 1. Tập hợp",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhận diện phần tử thuộc tập hợp", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Mô tả tập hợp bằng cách liệt kê hoặc tính chất", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế sử dụng tập hợp", state: "current", progress: 0 },
        ]
      },
      {
        id: "B2",
        title: "Bài 2. Cách ghi số tự nhiên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Đọc viết số trong hệ thập phân", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Giá trị các chữ số theo hàng", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Chữ số La Mã và ứng dụng ghi số", state: "current", progress: 0 },
        ]
      },
      {
        id: "B3",
        title: "Bài 3. Thứ tự trong tập hợp các số tự nhiên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "So sánh hai số tự nhiên", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Biểu diễn số trên trục số", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế tìm số liền trước/sau", state: "current", progress: 0 },
        ]
      },
      {
        id: "B4",
        title: "Bài 4. Phép cộng và phép trừ số tự nhiên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhắc lại phép cộng, phép trừ cơ bản", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính chất giao hoán, kết hợp", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tính nhanh và bài toán mua sắm thực tế", state: "current", progress: 0 },
        ]
      },
      {
        id: "B5",
        title: "Bài 5. Phép nhân và phép chia số tự nhiên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Phép nhân, phép chia hết và chia có dư", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính chất phân phối của phép nhân", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế chia nhóm, chia phần dư", state: "current", progress: 0 },
        ]
      },
      {
        id: "B6",
        title: "Bài 6. Lũy thừa với số mũ tự nhiên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Định nghĩa cơ số và số mũ", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Nhân, chia hai lũy thừa cùng cơ số", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Viết số lớn dưới dạng lũy thừa của 10", state: "current", progress: 0 },
        ]
      },
      {
        id: "B7",
        title: "Bài 7. Thứ tự thực hiện các phép tính",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Thứ tự tính không có dấu ngoặc", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Thứ tự tính có dấu ngoặc tròn, vuông, nhọn", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tìm x và tính nhanh biểu thức phức hợp", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "02": {
    title: "Tính chia hết trong tập hợp các số tự nhiên",
    overline: "Toán học lớp 6 · Chương II",
    summary: "Quan hệ chia hết, dấu hiệu chia hết, số nguyên tố, ước chung và bội chung.",
    xp: 1200,
    lessonsCount: 5,
    progress: 0,
    lessons: [
      {
        id: "B8",
        title: "Bài 8. Quan hệ chia hết và tính chất",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Khái niệm ước và bội", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính chất chia hết của một tổng/hiệu", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Chứng minh chia hết cơ bản", state: "current", progress: 0 },
        ]
      },
      {
        id: "B9",
        title: "Bài 9. Dấu hiệu chia hết",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Dấu hiệu chia hết cho 2, 5, 3, 9", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tìm chữ số thích hợp để số chia hết", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế kết hợp dấu hiệu chia hết", state: "current", progress: 0 },
        ]
      },
      {
        id: "B10",
        title: "Bài 10. Số nguyên tố",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Khái niệm số nguyên tố, hợp số", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Phân tích một số ra thừa số nguyên tố", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Ứng dụng phân tích thừa số giải bài toán chia kẹo", state: "current", progress: 0 },
        ]
      },
      {
        id: "B11",
        title: "Bài 11. Ước chung. Ước chung lớn nhất",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Tìm ước chung của hai hay nhiều số", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Cách tìm ước chung lớn nhất bằng phân tích nguyên tố", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế chia đều phần quà", state: "current", progress: 0 },
        ]
      },
      {
        id: "B12",
        title: "Bài 12. Bội chung. Bội chung nhỏ nhất",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Tìm bội chung của hai hay nhiều số", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Cách tìm bội chung nhỏ nhất bằng phân tích nguyên tố", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế thời gian lặp lại của xe buýt", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "03": {
    title: "Số nguyên",
    overline: "Toán học lớp 6 · Chương III",
    summary: "Tập hợp số nguyên, các phép tính và quy tắc dấu ngoặc.",
    xp: 1300,
    lessonsCount: 5,
    progress: 0,
    lessons: [
      {
        id: "B13",
        title: "Bài 13. Tập hợp các số nguyên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Số nguyên âm, số nguyên dương và số 0", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Biểu diễn số nguyên trên trục số, số đối", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "So sánh hai số nguyên trong nhiệt độ thực tế", state: "current", progress: 0 },
        ]
      },
      {
        id: "B14",
        title: "Bài 14. Phép cộng và phép trừ số nguyên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Cộng hai số nguyên cùng dấu", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Cộng trừ hai số nguyên khác dấu", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thay đổi độ cao, tài chính lời lỗ", state: "current", progress: 0 },
        ]
      },
      {
        id: "B15",
        title: "Bài 15. Quy tắc dấu ngoặc",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Quy tắc bỏ ngoặc có dấu cộng phía trước", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Quy tắc bỏ ngoặc có dấu trừ phía trước", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tính hợp lý biểu thức số nguyên lớn", state: "current", progress: 0 },
        ]
      },
      {
        id: "B16",
        title: "Bài 16. Phép nhân số nguyên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhân hai số nguyên cùng dấu, khác dấu", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính chất giao hoán, kết hợp phép nhân số nguyên", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán tích của nhiều số nguyên và dấu", state: "current", progress: 0 },
        ]
      },
      {
        id: "B17",
        title: "Bài 17. Phép chia hết. Ước và bội của một số nguyên",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Khái niệm ước và bội của một số nguyên", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tìm các ước của số nguyên", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán tìm số nguyên x thỏa mãn quan hệ chia hết", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "04": {
    title: "Một số hình phẳng trong thực tiễn",
    overline: "Toán học lớp 6 · Chương IV",
    summary: "Tam giác đều, hình vuông, lục giác đều, hình chữ nhật, hình thoi, hình bình hành.",
    xp: 1100,
    lessonsCount: 3,
    progress: 0,
    lessons: [
      {
        id: "B18",
        title: "Bài 18. Hình tam giác đều. Hình vuông. Hình lục giác đều",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhận diện tam giác đều, hình vuông, lục giác đều", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Đặc điểm về cạnh, góc, đường chéo của các hình", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Vẽ và gấp hình từ giấy thực tế", state: "current", progress: 0 },
        ]
      },
      {
        id: "B19",
        title: "Bài 19. Hình chữ nhật. Hình thoi. Hình bình hành. Hình thang cân",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhận diện hình chữ nhật, thoi, bình hành, thang cân", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính chất song song và bằng nhau của các cạnh, góc", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Ghép hình hình học tạo hoa văn mỹ thuật", state: "current", progress: 0 },
        ]
      },
      {
        id: "B20",
        title: "Bài 20. Chu vi và diện tích của một số tứ giác đã học",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Công thức chu vi, diện tích chữ nhật, vuông", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Công thức tính diện tích hình thoi, bình hành, thang cân", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế tính chi phí lót gạch, trồng cỏ sân vườn", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "05": {
    title: "Tính đối xứng của hình phẳng trong tự nhiên",
    overline: "Toán học lớp 6 · Chương V",
    summary: "Trục đối xứng và tâm đối xứng của các hình phẳng.",
    xp: 1000,
    lessonsCount: 2,
    progress: 0,
    lessons: [
      {
        id: "B21",
        title: "Bài 21. Hình có trục đối xứng",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhận biết hình có gương đối xứng, trục đối xứng", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Xác định số lượng trục đối xứng của hình học cơ bản", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tìm hình đối xứng trong tự nhiên (lá cây, logo thương hiệu)", state: "current", progress: 0 },
        ]
      },
      {
        id: "B22",
        title: "Bài 22. Hình có tâm đối xứng",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhận diện hình có tâm đối xứng khi quay 180 độ", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Xác định tâm đối xứng của hình vuông, hình tròn", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Ứng dụng thiết kế chong chóng, cánh quạt đối xứng xoay", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "06": {
    title: "Phân số",
    overline: "Toán học lớp 6 · Chương VI",
    summary: "Khái niệm phân số, phân số bằng nhau, so sánh phân số và các phép tính phân số.",
    xp: 1500,
    lessonsCount: 5,
    progress: 62,
    lessons: [
      {
        id: "B23",
        title: "Bài 23. Mở rộng khái niệm phân số. Phân số bằng nhau",
        progress: 100,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Khái niệm phân số với tử và mẫu số nguyên", state: "done", progress: 100 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Nhận biết phân số bằng nhau và tính chất cơ bản", state: "done", progress: 100 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Rút gọn phân số về tối giản", state: "done", progress: 100 },
        ]
      },
      {
        id: "B24",
        title: "Bài 24. So sánh phân số. Hỗn số dương",
        progress: 60,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "So sánh hai phân số cùng mẫu", state: "done", progress: 100 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Quy đồng mẫu để so sánh phân số khác mẫu", state: "current", progress: 60 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Chuyển phân số sang hỗn số và ngược lại", state: "current", progress: 0 },
        ]
      },
      {
        id: "B25",
        title: "Bài 25. Phép cộng và phép trừ phân số",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Cộng trừ phân số cùng mẫu số", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Cộng trừ phân số khác mẫu số", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tính nhanh tổng phân số bằng quy tắc bỏ ngoặc", state: "current", progress: 0 },
        ]
      },
      {
        id: "B26",
        title: "Bài 26. Phép nhân và phép chia phân số",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Quy tắc nhân, chia phân số cơ bản", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính chất của phép nhân phân số", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tìm số đối, số nghịch đảo và tính giá trị biểu thức phức tạp", state: "current", progress: 0 },
        ]
      },
      {
        id: "B27",
        title: "Bài 27. Hai bài toán về phân số",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Tìm giá trị phân số của một số cho trước", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tìm một số biết giá trị một phân số của số đó", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế tính toán kế hoạch chia tài sản, chia đất", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "07": {
    title: "Số thập phân",
    overline: "Toán học lớp 6 · Chương VII",
    summary: "Tính toán số thập phân, làm tròn, ước lượng và các bài toán tỉ số.",
    xp: 1250,
    lessonsCount: 4,
    progress: 0,
    lessons: [
      {
        id: "B28",
        title: "Bài 28. Số thập phân",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Viết phân số thập phân sang số thập phân", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "So sánh hai số thập phân, xác định số âm/dương", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Ứng dụng số thập phân trong đo đạc chiều dài", state: "current", progress: 0 },
        ]
      },
      {
        id: "B29",
        title: "Bài 29. Tính toán với số thập phân",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Cộng, trừ, nhân, chia số thập phân cơ bản", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Quy tắc tính có dấu ngoặc đối với số thập phân", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế tính tiền hóa đơn, lãi suất ngân hàng", state: "current", progress: 0 },
        ]
      },
      {
        id: "B30",
        title: "Bài 30. Làm tròn và ước lượng",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Quy tắc làm tròn số thập phân đến hàng đơn vị", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Làm tròn số thập phân với độ chính xác cho trước", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Ước lượng kết quả phép tính để kiểm tra mua hàng", state: "current", progress: 0 },
        ]
      },
      {
        id: "B31",
        title: "Bài 31. Một số bài toán về tỉ số và tỉ số phần trăm",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Tỉ số của hai số, tỉ số phần trăm", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tìm tỉ số phần trăm của hai số", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tính tiền giảm giá sản phẩm, lãi suất tiết kiệm hàng năm", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "08": {
    title: "Những hình hình học cơ bản",
    overline: "Toán học lớp 6 · Chương VIII",
    summary: "Điểm, đường thẳng, tia, đoạn thẳng, trung điểm và góc.",
    xp: 1350,
    lessonsCount: 6,
    progress: 0,
    lessons: [
      {
        id: "B32",
        title: "Bài 32. Điểm và đường thẳng",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Khái niệm điểm thuộc/không thuộc đường thẳng", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Ba điểm thẳng hàng, hai đường thẳng cắt nhau", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Vẽ đường thẳng đi qua các điểm cho trước", state: "current", progress: 0 },
        ]
      },
      {
        id: "B33",
        title: "Bài 33. Điểm nằm giữa hai điểm. Tia",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Nhận biết điểm nằm giữa hai điểm", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Khái niệm tia, hai tia đối nhau, hai tia trùng nhau", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Đếm số tia tạo thành từ nhiều điểm trên đường thẳng", state: "current", progress: 0 },
        ]
      },
      {
        id: "B34",
        title: "Bài 34. Đoạn thẳng. Độ dài đoạn thẳng",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Khái niệm đoạn thẳng", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Độ dài đoạn thẳng, so sánh độ dài", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tính độ dài đoạn thẳng khi biết điểm nằm giữa", state: "current", progress: 0 },
        ]
      },
      {
        id: "B35",
        title: "Bài 35. Trung điểm của đoạn thẳng",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Định nghĩa trung điểm đoạn thẳng", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính độ dài các đoạn thẳng tạo bởi trung điểm", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Xác định trung điểm trên thực tế (cân bằng bập bênh)", state: "current", progress: 0 },
        ]
      },
      {
        id: "B36",
        title: "Bài 36. Góc",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Đỉnh, cạnh của góc, góc bẹt", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Điểm nằm trong góc", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tìm góc tạo bởi các kim đồng hồ thực tế", state: "current", progress: 0 },
        ]
      },
      {
        id: "B37",
        title: "Bài 37. Số đo góc",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Đo góc bằng thước đo độ, đơn vị độ", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Góc vuông, góc nhọn, góc tù, so sánh góc", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Tính toán số đo góc liên quan tia phân giác", state: "current", progress: 0 },
        ]
      }
    ]
  },
  "09": {
    title: "Dữ liệu và xác suất thực nghiệm",
    overline: "Toán học lớp 6 · Chương IX",
    summary: "Thu thập dữ liệu, biểu đồ tranh, biểu đồ cột, cột kép và xác suất thực nghiệm.",
    xp: 1450,
    lessonsCount: 6,
    progress: 0,
    lessons: [
      {
        id: "B38",
        title: "Bài 38. Dữ liệu và thu thập dữ liệu",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Dữ liệu là số, dữ liệu không phải là số", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Các phương pháp thu thập dữ liệu cơ bản", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Lập bảng thu thập thông tin của lớp", state: "current", progress: 0 },
        ]
      },
      {
        id: "B39",
        title: "Bài 39. Bảng thống kê và biểu đồ tranh",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Đọc thông tin từ bảng thống kê, biểu đồ tranh", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Lập bảng thống kê từ biểu đồ tranh và ngược lại", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Bài toán thực tế rút ra nhận xét từ biểu đồ tranh", state: "current", progress: 0 },
        ]
      },
      {
        id: "B40",
        title: "Bài 40. Biểu đồ cột",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Đọc dữ liệu trên biểu đồ cột", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Vẽ biểu đồ cột từ bảng số liệu đơn giản", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Phân tích xu hướng tăng/giảm từ biểu đồ cột", state: "current", progress: 0 },
        ]
      },
      {
        id: "B41",
        title: "Bài 41. Biểu đồ cột kép",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Đọc dữ liệu biểu đồ cột kép", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "So sánh các cột dữ liệu trong cùng một nhóm", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Phân tích dữ liệu cột kép đưa ra dự báo", state: "current", progress: 0 },
        ]
      },
      {
        id: "B42",
        title: "Bài 42. Kết quả có thể và sự kiện trong trò chơi, thí nghiệm",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Các kết quả có thể của trò chơi tung đồng xu", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Mô tả sự kiện chắc chắn xảy ra, không thể xảy ra", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Đoán kết quả quay vòng quay số", state: "current", progress: 0 },
        ]
      },
      {
        id: "B43",
        title: "Bài 43. Xác suất thực nghiệm",
        progress: 0,
        state: "active",
        difficulties: [
          { id: "NB", title: "Nhận biết (Dễ)", level: "beginner", detail: "Công thức tính tỉ số xác suất thực nghiệm", state: "current", progress: 0 },
          { id: "TH", title: "Thông hiểu (Vừa)", level: "intermediate", detail: "Tính xác suất thực nghiệm của sự kiện sau n lần thử", state: "current", progress: 0 },
          { id: "VD", title: "Vận dụng (Khó)", level: "advanced", detail: "Ứng dụng dự báo số lần trúng mục tiêu thực tế", state: "current", progress: 0 },
        ]
      }
    ]
  }
};

function ChapterDetailPageContent() {
  const searchParams = useSearchParams();
  const subjectCode = searchParams.get("subject") || "TO";
  const chapterId = searchParams.get("id") || "06";

  const chapter = useMemo(() => {
    return chaptersContent[chapterId] || chaptersContent["06"];
  }, [chapterId]);

  return (
    <>
      <section className="chapter-page-head">
        <Link className="back-link" href={`/hoc-tap?subject=${subjectCode}`}>← Lộ trình học</Link>
        <div>
          <span className="overline">{chapter.overline}</span>
          <h1>{chapter.title}</h1>
          <p>{chapter.lessonsCount} bài học · 3 mức độ khó mỗi bài · tối đa {chapter.xp.toLocaleString("vi-VN")} XP</p>
        </div>
        <aside>
          <span>Tiến độ chương</span>
          <strong>{chapter.progress}%</strong>
          <ProgressBar value={chapter.progress} />
        </aside>
      </section>

      <section className="chapter-detail" aria-label={`Các bài học trong chương ${chapterId}`}>
        <div className="chapter-detail-intro">
          <p>{chapter.summary}</p>
          <ProgressBar value={chapter.progress} />
        </div>
        <div className="chapter-type-stack">
          {chapter.lessons.map((lesson) => (
            <details className={`chapter-type ${lesson.state}`} open={lesson.state === "active"} key={lesson.id}>
              <summary>
                <span className="chapter-type-index">{lesson.id}</span>
                <div className="chapter-type-title">
                  <strong>{lesson.title}</strong>
                </div>
                <span className="chapter-type-progress">3 mức độ khó · {lesson.progress}%</span>
                <span className="type-toggle">Chi tiết</span>
              </summary>
              <div className="chapter-lesson-grid">
                {lesson.difficulties.map((diff) => (
                  <Link
                    className={`chapter-lesson ${diff.state}`}
                    href={`/luyen-tap?subject=${subjectCode}&id=${chapterId}`}
                    key={diff.title}
                  >
                    <span>
                      {diff.id === "NB" ? "1" : diff.id === "TH" ? "2" : "3"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <LevelBadge level={diff.level} />
                        <strong>{diff.title}</strong>
                      </div>
                      <small>{diff.detail}</small>
                      <div className="mt-2 text-[10px] text-gray-400">
                        Tiến độ: {diff.progress}%
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </div>
        <footer className="chapter-detail-footer">
          <span>{chapter.progress}% hoàn thành chương</span>
          <Link href={`/luyen-tap?subject=${subjectCode}&id=${chapterId}`}>Tiếp tục bài học hiện tại →</Link>
        </footer>
      </section>
    </>
  );
}

export default function ChapterDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted">Đang tải chi tiết chương...</div>}>
      <AppShell>
        <ChapterDetailPageContent />
      </AppShell>
    </Suspense>
  );
}
