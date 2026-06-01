import { useState } from "react";
import Icon from "@/components/ui/icon";

type Role = "foreman" | "engineer";
type Section =
  | "dashboard"
  | "attendance"
  | "workplan"
  | "docs"
  | "report"
  | "approvals"
  | "warehouse"
  | "safety"
  | "analytics";

interface Worker {
  id: number;
  name: string;
  role: string;
  present: boolean;
  photo: string;
  helmet: boolean;
  vest: boolean;
  gloves: boolean;
}

interface Task {
  id: number;
  team: string;
  description: string;
  location: string;
  workers: number;
  status: "pending" | "in_progress" | "done";
}

interface ApprovalRequest {
  id: number;
  author: string;
  time: string;
  description: string;
  status: "new" | "approved" | "rejected";
  type: "change" | "issue" | "safety";
}

const initialWorkers: Worker[] = [
  { id: 1, name: "Иванов А.С.", role: "Монтажник", present: true, photo: "И", helmet: true, vest: true, gloves: true },
  { id: 2, name: "Петров В.И.", role: "Монтажник", present: true, photo: "П", helmet: true, vest: false, gloves: true },
  { id: 3, name: "Сидоров М.К.", role: "Сварщик", present: false, photo: "С", helmet: true, vest: true, gloves: true },
  { id: 4, name: "Козлов Д.Р.", role: "Монтажник", present: true, photo: "К", helmet: false, vest: true, gloves: false },
  { id: 5, name: "Новиков П.А.", role: "Разнорабочий", present: true, photo: "Н", helmet: true, vest: true, gloves: true },
  { id: 6, name: "Морозов С.Т.", role: "Электрик", present: true, photo: "М", helmet: true, vest: true, gloves: true },
];

const initialTasks: Task[] = [
  { id: 1, team: "Звено А", description: "Монтаж трубопровода Ду100, ось 1-3", location: "Этаж 2, секция B", workers: 3, status: "in_progress" },
  { id: 2, team: "Звено Б", description: "Установка опорных конструкций", location: "Этаж 1, ось 4-6", workers: 2, status: "pending" },
  { id: 3, team: "Звено В", description: "Сварочные работы на стояках", location: "Шахта лифта", workers: 2, status: "done" },
];

const initialApprovals: ApprovalRequest[] = [
  { id: 1, author: "Прораб Смирнов", time: "08:42", description: "Стояк В3 невозможно провести по проекту — перекрытие занято кабельным лотком. Прошу согласовать отступ 200мм.", status: "new", type: "change" },
  { id: 2, author: "Прораб Коваль", time: "10:15", description: "Нарушение ОТ — рабочий Петров без защитного жилета на высоте. Зафиксировано, инструктаж проведён.", status: "approved", type: "safety" },
  { id: 3, author: "Прораб Смирнов", time: "11:30", description: "Закончились уплотнители DN100. Необходима срочная закупка 50 шт.", status: "new", type: "issue" },
];

const warehouseItems = [
  { name: "Труба стальная Ду100", unit: "м.п.", stock: 145, issued: 12 },
  { name: "Фланец Ду100 PN16", unit: "шт", stock: 48, issued: 8 },
  { name: "Уплотнитель DN100", unit: "шт", stock: 3, issued: 0 },
  { name: "Болт М16×60", unit: "шт", stock: 220, issued: 40 },
  { name: "Перфоратор Bosch GBH", unit: "шт", stock: 4, issued: 2 },
  { name: "Угловая шлифмашина", unit: "шт", stock: 6, issued: 3 },
];

const analyticsProjects = [
  { name: "ЖК «Северный»", attendance: 87, planDone: 74, violations: 2, status: "active" },
  { name: "ТЦ «Меридиан»", attendance: 94, planDone: 91, violations: 0, status: "active" },
  { name: "Завод «Техпром»", attendance: 78, planDone: 65, violations: 5, status: "delay" },
  { name: "БЦ «Горизонт»", attendance: 100, planDone: 88, violations: 1, status: "active" },
];

export default function Index() {
  const [role, setRole] = useState<Role>("foreman");
  const [section, setSection] = useState<Section>("dashboard");
  const [workerList, setWorkerList] = useState(initialWorkers);
  const [approvalList, setApprovalList] = useState(initialApprovals);

  const presentCount = workerList.filter((w) => w.present).length;
  const violationsCount = workerList.filter((w) => w.present && (!w.helmet || !w.vest || !w.gloves)).length;
  const newApprovalsCount = approvalList.filter((a) => a.status === "new").length;

  const togglePresence = (id: number) => {
    setWorkerList((prev) => prev.map((w) => (w.id === id ? { ...w, present: !w.present } : w)));
  };

  const handleApproval = (id: number, status: "approved" | "rejected") => {
    setApprovalList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const navItems =
    role === "foreman"
      ? [
          { key: "dashboard", label: "Главная", icon: "LayoutDashboard" },
          { key: "attendance", label: "Табель", icon: "Users" },
          { key: "workplan", label: "План работ", icon: "ClipboardList" },
          { key: "docs", label: "Документация", icon: "FolderOpen" },
          { key: "report", label: "Отчёт дня", icon: "FileText" },
          { key: "approvals", label: "Согласования", icon: "MessageSquare" },
          { key: "warehouse", label: "Склад", icon: "Package" },
          { key: "safety", label: "Охрана труда", icon: "ShieldAlert" },
        ]
      : [
          { key: "dashboard", label: "Главная", icon: "LayoutDashboard" },
          { key: "approvals", label: "Согласования", icon: "MessageSquare" },
          { key: "analytics", label: "Аналитика", icon: "BarChart3" },
        ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-ibm">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1117]/95 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Icon name="HardHat" size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">СтройКонтроль</div>
            <div className="text-[10px] text-white/40">ЖК «Северный» · Монтаж ИТП</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setRole("foreman"); setSection("dashboard"); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${role === "foreman" ? "bg-orange-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
          >
            Прораб
          </button>
          <button
            onClick={() => { setRole("engineer"); setSection("dashboard"); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${role === "engineer" ? "bg-orange-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
          >
            Инженер
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="hidden md:flex flex-col w-56 min-h-[calc(100vh-57px)] bg-[#13151c] border-r border-white/5 p-3 gap-1 sticky top-[57px]">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key as Section)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                section === item.key
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
              {item.key === "approvals" && newApprovalsCount > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {newApprovalsCount}
                </span>
              )}
            </button>
          ))}

          <div className="mt-auto pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold">
                {role === "foreman" ? "С" : "И"}
              </div>
              <div>
                <div className="text-xs font-medium">{role === "foreman" ? "Смирнов В.А." : "Инж. Ковалёв"}</div>
                <div className="text-[10px] text-white/30">{role === "foreman" ? "Прораб" : "Инженер"}</div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#13151c] border-t border-white/5 flex justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.key}
              onClick={() => setSection(item.key as Section)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all relative ${
                section === item.key ? "text-orange-400" : "text-white/30"
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[9px]">{item.label}</span>
              {item.key === "approvals" && newApprovalsCount > 0 && (
                <span className="absolute -top-0.5 right-0 bg-orange-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {newApprovalsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">

          {/* DASHBOARD */}
          {section === "dashboard" && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Понедельник, 2 июня 2026</div>
                <h1 className="text-xl font-bold">
                  {role === "foreman" ? "Добро пожаловать, Смирнов" : "Панель инженера"}
                </h1>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Рабочих вышло", value: `${presentCount}/${initialWorkers.length}`, icon: "Users", color: "orange" },
                  { label: "Задач сегодня", value: initialTasks.length, icon: "ClipboardList", color: "blue" },
                  { label: "Нарушений ОТ", value: violationsCount, icon: "ShieldAlert", color: violationsCount > 0 ? "red" : "green" },
                  { label: "Ожидают согласования", value: newApprovalsCount, icon: "MessageSquare", color: "yellow" },
                ].map((card) => (
                  <div key={card.label} className="bg-[#13151c] rounded-2xl p-4 border border-white/5">
                    <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${
                      card.color === "orange" ? "bg-orange-500/15 text-orange-400" :
                      card.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                      card.color === "red" ? "bg-red-500/15 text-red-400" :
                      card.color === "green" ? "bg-green-500/15 text-green-400" :
                      "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      <Icon name={card.icon} size={16} />
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{card.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-sm font-semibold">Задачи на сегодня</span>
                  <button onClick={() => setSection("workplan")} className="text-xs text-orange-400 hover:text-orange-300">Все →</button>
                </div>
                {initialTasks.map((task) => (
                  <div key={task.id} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status === "done" ? "bg-green-400" :
                      task.status === "in_progress" ? "bg-orange-400" : "bg-white/20"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{task.team}</div>
                      <div className="text-xs text-white/40 truncate">{task.description}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                      task.status === "done" ? "bg-green-500/15 text-green-400" :
                      task.status === "in_progress" ? "bg-orange-500/15 text-orange-400" :
                      "bg-white/5 text-white/40"
                    }`}>
                      {task.status === "done" ? "Готово" : task.status === "in_progress" ? "В работе" : "Ожидает"}
                    </span>
                  </div>
                ))}
              </div>

              {newApprovalsCount > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="Bell" size={16} className="text-orange-400" />
                      <span className="text-sm font-medium text-orange-300">
                        {newApprovalsCount} {newApprovalsCount === 1 ? "запрос ожидает" : "запроса ожидают"} согласования
                      </span>
                    </div>
                    <button onClick={() => setSection("approvals")} className="text-xs text-orange-400 hover:text-orange-300">
                      Перейти →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ATTENDANCE */}
          {section === "attendance" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">Табель учёта</h1>
                  <div className="text-xs text-white/40 mt-0.5">Понедельник, 2 июня 2026</div>
                </div>
                <div className="bg-orange-500/15 border border-orange-500/20 rounded-xl px-3 py-2 text-center">
                  <div className="text-lg font-bold text-orange-400">{presentCount}/{initialWorkers.length}</div>
                  <div className="text-[10px] text-white/40">Явка</div>
                </div>
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Camera" size={16} className="text-orange-400" />
                  <span className="text-sm font-semibold">Утренняя фотофиксация</span>
                </div>
                <button className="w-full border-2 border-dashed border-white/10 rounded-xl py-6 text-white/30 text-sm hover:border-orange-500/30 hover:text-orange-400 transition-all flex flex-col items-center gap-2">
                  <Icon name="Camera" size={24} />
                  <span>Сфотографировать бригаду</span>
                </button>
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold">Состав бригады</div>
                {workerList.map((worker) => {
                  const hasViolation = worker.present && (!worker.helmet || !worker.vest || !worker.gloves);
                  return (
                    <div key={worker.id} className={`px-4 py-3 border-b border-white/5 last:border-0 flex items-center gap-3 ${hasViolation ? "bg-red-500/5" : ""}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${worker.present ? "bg-orange-500/20 text-orange-400" : "bg-white/5 text-white/20"}`}>
                        {worker.photo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{worker.name}</div>
                        <div className="text-xs text-white/40">{worker.role}</div>
                        {hasViolation && (
                          <div className="text-[10px] text-red-400 mt-0.5 flex items-center gap-1">
                            <Icon name="AlertTriangle" size={10} />
                            {!worker.helmet && "нет каски "}
                            {!worker.vest && "нет жилета "}
                            {!worker.gloves && "нет перчаток"}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[
                            { k: "helmet" as keyof Worker, label: "К" },
                            { k: "vest" as keyof Worker, label: "Ж" },
                            { k: "gloves" as keyof Worker, label: "П" },
                          ].map((eq) => (
                            <div key={eq.k} className={`w-6 h-6 rounded text-[9px] flex items-center justify-center font-bold ${worker[eq.k] ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {eq.label}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => togglePresence(worker.id)}
                          className={`text-xs px-3 py-1 rounded-lg transition-all ${worker.present ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/30"}`}
                        >
                          {worker.present ? "Вышел" : "Не вышел"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <Icon name="CheckCircle" size={16} />
                Подтвердить табель на утро
              </button>
            </div>
          )}

          {/* WORK PLAN */}
          {section === "workplan" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">План работ</h1>
                  <div className="text-xs text-white/40 mt-0.5">Понедельник, 2 июня 2026</div>
                </div>
                <button className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1">
                  <Icon name="Plus" size={14} />
                  Задача
                </button>
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"].map((day, i) => (
                  <button
                    key={day}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs transition-all ${i === 0 ? "bg-orange-500 text-white" : "bg-[#13151c] text-white/40 hover:bg-white/5"}`}
                  >
                    <span>{day}</span>
                    <span className="font-bold text-sm mt-0.5">{2 + i}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {initialTasks.map((task) => (
                  <div key={task.id} className="bg-[#13151c] rounded-2xl border border-white/5 p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full">{task.team}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.status === "done" ? "bg-green-500/15 text-green-400" :
                            task.status === "in_progress" ? "bg-blue-500/15 text-blue-400" :
                            "bg-white/5 text-white/40"
                          }`}>
                            {task.status === "done" ? "Выполнено" : task.status === "in_progress" ? "В работе" : "Ожидает"}
                          </span>
                        </div>
                        <div className="text-sm font-semibold">{task.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{task.location}</span>
                      <span className="flex items-center gap-1"><Icon name="Users" size={11} />{task.workers} чел.</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1">
                        <Icon name="Camera" size={12} />
                        Фото
                      </button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1">
                        <Icon name="CheckCircle" size={12} />
                        Отметить
                      </button>
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1">
                        <Icon name="AlertCircle" size={12} />
                        Замечание
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCS */}
          {section === "docs" && (
            <div className="space-y-5 animate-fade-in">
              <h1 className="text-xl font-bold">Рабочая документация</h1>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Проект ИТП", type: "PDF", size: "12.4 МБ", icon: "FileText", date: "15.05.2026" },
                  { name: "Смета", type: "XLSX", size: "3.2 МБ", icon: "Table", date: "15.05.2026" },
                  { name: "Чертежи узлов", type: "DWG", size: "45.1 МБ", icon: "PenTool", date: "20.05.2026" },
                  { name: "ТЗ заказчика", type: "PDF", size: "2.8 МБ", icon: "FileCheck", date: "10.05.2026" },
                  { name: "Акт стройготовности", type: "PDF", size: "1.1 МБ", icon: "ClipboardCheck", date: "28.05.2026" },
                  { name: "График работ", type: "PDF", size: "0.9 МБ", icon: "CalendarDays", date: "01.06.2026" },
                ].map((doc) => (
                  <button key={doc.name} className="bg-[#13151c] rounded-2xl border border-white/5 p-4 text-left hover:border-orange-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-orange-500/10 flex items-center justify-center mb-3 transition-all">
                      <Icon name={doc.icon} size={18} className="text-white/40 group-hover:text-orange-400 transition-all" />
                    </div>
                    <div className="text-sm font-medium leading-tight">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-white/5 text-white/40 px-1.5 py-0.5 rounded">{doc.type}</span>
                      <span className="text-[10px] text-white/30">{doc.size}</span>
                    </div>
                    <div className="text-[10px] text-white/20 mt-1">{doc.date}</div>
                  </button>
                ))}
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="Upload" size={16} className="text-orange-400" />
                  <span className="text-sm font-semibold">Загрузить документ</span>
                </div>
                <button className="w-full border-2 border-dashed border-white/10 rounded-xl py-5 text-white/30 text-sm hover:border-orange-500/30 hover:text-orange-400 transition-all flex flex-col items-center gap-2">
                  <Icon name="Upload" size={20} />
                  <span>Выбрать файл или папку</span>
                </button>
              </div>
            </div>
          )}

          {/* REPORT */}
          {section === "report" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Дневной отчёт</h1>
                <span className="text-xs text-white/30">2 июня 2026</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Рабочих", value: `${presentCount}`, sub: `из ${initialWorkers.length}` },
                  { label: "Задач выполнено", value: `${initialTasks.filter(t => t.status === "done").length}`, sub: `из ${initialTasks.length}` },
                  { label: "Замечаний ОТ", value: `${violationsCount}`, sub: "выявлено" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#13151c] rounded-xl p-3 border border-white/5 text-center">
                    <div className="text-xl font-bold text-orange-400">{s.value}</div>
                    <div className="text-[10px] text-white/30">{s.sub}</div>
                    <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 p-4 space-y-4">
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Выполненные работы</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50 transition-all"
                    rows={3}
                    placeholder="Опишите что сделано за день..."
                    defaultValue="Смонтировано 18 м.п. трубопровода Ду100, установлено 6 опорных конструкций. Выполнена сварка 4 стыков на стояке В3."
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Замечания и проблемы</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50 transition-all"
                    rows={2}
                    placeholder="Опишите замечания если есть..."
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Фото и видео</label>
                  <div className="flex gap-2">
                    <button className="flex-1 border-2 border-dashed border-white/10 rounded-xl py-4 text-white/30 text-xs hover:border-orange-500/30 hover:text-orange-400 transition-all flex flex-col items-center gap-1">
                      <Icon name="Camera" size={18} />
                      <span>Фото</span>
                    </button>
                    <button className="flex-1 border-2 border-dashed border-white/10 rounded-xl py-4 text-white/30 text-xs hover:border-orange-500/30 hover:text-orange-400 transition-all flex flex-col items-center gap-1">
                      <Icon name="Video" size={18} />
                      <span>Видео</span>
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                <Icon name="Send" size={16} />
                Отправить отчёт инженеру
              </button>
            </div>
          )}

          {/* APPROVALS */}
          {section === "approvals" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Согласования</h1>
                {role === "foreman" && (
                  <button className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1">
                    <Icon name="Plus" size={14} />
                    Запрос
                  </button>
                )}
              </div>

              {role === "foreman" && (
                <div className="bg-[#13151c] rounded-2xl border border-white/5 p-4 space-y-3">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Icon name="Plus" size={14} className="text-orange-400" />
                    Новый запрос на согласование
                  </div>
                  <div className="flex gap-2">
                    {[
                      { type: "change", label: "Изменение", icon: "GitBranch" },
                      { type: "issue", label: "Проблема", icon: "AlertCircle" },
                      { type: "safety", label: "ОТ", icon: "ShieldAlert" },
                    ].map((t) => (
                      <button key={t.type} className="flex-1 bg-white/5 hover:bg-orange-500/10 hover:text-orange-400 text-white/40 text-xs py-2 rounded-lg transition-all flex flex-col items-center gap-1">
                        <Icon name={t.icon} size={14} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50 transition-all"
                    rows={2}
                    placeholder="Опишите ситуацию, проблему или изменение..."
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 border border-dashed border-white/10 rounded-lg py-2 text-white/30 text-xs hover:border-orange-500/30 hover:text-orange-400 transition-all flex items-center justify-center gap-1">
                      <Icon name="Paperclip" size={12} />
                      Прикрепить фото
                    </button>
                    <button className="px-4 bg-orange-500 hover:bg-orange-400 text-white text-xs py-2 rounded-lg transition-all flex items-center gap-1">
                      <Icon name="Send" size={12} />
                      Отправить
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {approvalList.map((req) => (
                  <div key={req.id} className={`bg-[#13151c] rounded-2xl border overflow-hidden ${
                    req.status === "new" ? "border-orange-500/30" :
                    req.status === "approved" ? "border-green-500/20" :
                    "border-red-500/20"
                  }`}>
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          req.type === "change" ? "bg-blue-500/15 text-blue-400" :
                          req.type === "safety" ? "bg-red-500/15 text-red-400" :
                          "bg-yellow-500/15 text-yellow-400"
                        }`}>
                          <Icon name={req.type === "change" ? "GitBranch" : req.type === "safety" ? "ShieldAlert" : "AlertCircle"} size={12} />
                        </div>
                        <span className="text-xs text-white/40">{req.author} · {req.time}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        req.status === "new" ? "bg-orange-500/15 text-orange-400" :
                        req.status === "approved" ? "bg-green-500/15 text-green-400" :
                        "bg-red-500/15 text-red-400"
                      }`}>
                        {req.status === "new" ? "Ожидает" : req.status === "approved" ? "Согласовано" : "Отклонено"}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm text-white/80 leading-relaxed">{req.description}</p>
                      <button className="mt-2 text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                        <Icon name="Paperclip" size={11} />
                        Приложены фото (2)
                      </button>
                    </div>
                    {role === "engineer" && req.status === "new" && (
                      <div className="px-4 pb-3 flex gap-2">
                        <button
                          onClick={() => handleApproval(req.id, "approved")}
                          className="flex-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Icon name="Check" size={12} />
                          Согласовать
                        </button>
                        <button
                          onClick={() => handleApproval(req.id, "rejected")}
                          className="flex-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Icon name="X" size={12} />
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WAREHOUSE */}
          {section === "warehouse" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Склад</h1>
                <button className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1">
                  <Icon name="Plus" size={14} />
                  Выдача
                </button>
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 grid grid-cols-4 text-xs text-white/30">
                  <span className="col-span-2">Наименование</span>
                  <span className="text-center">Остаток</span>
                  <span className="text-center">Выдано</span>
                </div>
                {warehouseItems.map((item, i) => (
                  <div key={i} className={`px-4 py-3 border-b border-white/5 last:border-0 grid grid-cols-4 items-center ${item.stock < 10 ? "bg-red-500/5" : ""}`}>
                    <div className="col-span-2">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-white/30">{item.unit}</div>
                      {item.stock < 10 && (
                        <div className="text-[10px] text-red-400 flex items-center gap-0.5">
                          <Icon name="AlertTriangle" size={9} />Мало
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className={`text-sm font-bold ${item.stock < 10 ? "text-red-400" : "text-white"}`}>{item.stock}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-white/50">{item.issued}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="AlertTriangle" size={14} className="text-orange-400" />
                  <span className="text-sm font-medium text-orange-300">Требуется закупка</span>
                </div>
                <div className="text-xs text-white/50">Уплотнитель DN100 — критически мало (3 шт.)</div>
                <button className="mt-3 text-xs bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1">
                  <Icon name="Send" size={11} />
                  Оформить заявку на закупку
                </button>
              </div>
            </div>
          )}

          {/* SAFETY */}
          {section === "safety" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Охрана труда</h1>
                <div className={`text-xs px-3 py-1.5 rounded-xl ${violationsCount > 0 ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-green-500/15 text-green-400 border border-green-500/20"}`}>
                  {violationsCount > 0 ? `${violationsCount} нарушения` : "Нарушений нет"}
                </div>
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold">Проверка СИЗ по бригаде</div>
                {workerList.filter(w => w.present).map((worker) => {
                  const ok = worker.helmet && worker.vest && worker.gloves;
                  return (
                    <div key={worker.id} className={`px-4 py-3 border-b border-white/5 last:border-0 ${!ok ? "bg-red-500/5" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                            {worker.photo}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{worker.name}</div>
                            <div className="text-xs text-white/30">{worker.role}</div>
                          </div>
                        </div>
                        <Icon name={ok ? "CheckCircle" : "XCircle"} size={16} className={ok ? "text-green-400" : "text-red-400"} />
                      </div>
                      <div className="flex gap-2">
                        {[
                          { label: "Каска", ok: worker.helmet },
                          { label: "Жилет", ok: worker.vest },
                          { label: "Перчатки", ok: worker.gloves },
                          { label: "Очки", ok: true },
                        ].map((item) => (
                          <div key={item.label} className={`text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 ${item.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            <Icon name={item.ok ? "Check" : "X"} size={9} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 p-4 space-y-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <Icon name="Camera" size={14} className="text-orange-400" />
                  Зафиксировать нарушение
                </div>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/20 resize-none focus:outline-none focus:border-orange-500/50 transition-all"
                  rows={2}
                  placeholder="Опишите нарушение охраны труда..."
                />
                <div className="flex gap-2">
                  <button className="flex-1 border border-dashed border-white/10 rounded-lg py-2 text-white/30 text-xs hover:border-orange-500/30 hover:text-orange-400 transition-all flex items-center justify-center gap-1">
                    <Icon name="Camera" size={12} />
                    Фото нарушения
                  </button>
                  <button className="px-4 bg-red-500/80 hover:bg-red-500 text-white text-xs py-2 rounded-lg transition-all flex items-center gap-1">
                    <Icon name="AlertTriangle" size={12} />
                    Зафиксировать
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {section === "analytics" && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="text-xl font-bold">Аналитика проектов</h1>
                <div className="text-xs text-white/40 mt-0.5">Сводка за июнь 2026</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Всего проектов", value: "4", icon: "Building2", color: "blue" },
                  { label: "Средняя явка", value: "90%", icon: "Users", color: "orange" },
                  { label: "Ср. выполнение плана", value: "80%", icon: "TrendingUp", color: "green" },
                  { label: "Нарушений ОТ", value: "8", icon: "ShieldAlert", color: "red" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#13151c] rounded-2xl border border-white/5 p-4">
                    <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center ${
                      s.color === "blue" ? "bg-blue-500/15 text-blue-400" :
                      s.color === "orange" ? "bg-orange-500/15 text-orange-400" :
                      s.color === "green" ? "bg-green-500/15 text-green-400" :
                      "bg-red-500/15 text-red-400"
                    }`}>
                      <Icon name={s.icon} size={16} />
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold">По объектам</div>
                {analyticsProjects.map((proj) => (
                  <div key={proj.name} className="px-4 py-4 border-b border-white/5 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold">{proj.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${proj.status === "active" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                            {proj.status === "active" ? "В графике" : "Отставание"}
                          </span>
                          {proj.violations > 0 && (
                            <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                              <Icon name="AlertTriangle" size={9} />{proj.violations} нарушений ОТ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40">Явка</span>
                          <span className="text-white/70">{proj.attendance}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${proj.attendance}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40">Выполнение плана</span>
                          <span className="text-white/70">{proj.planDone}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${proj.planDone >= 80 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${proj.planDone}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
