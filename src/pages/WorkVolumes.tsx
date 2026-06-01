import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchWorkVolumes, addWorkVolume, getExcelUrl, getExcelHeaders } from "@/lib/mediaApi";
import type { WorkVolume } from "@/lib/mediaApi";

const COMMON_WORKS = [
  { name: "Монтаж трубопровода", unit: "м.п." },
  { name: "Сварка стыков", unit: "шт" },
  { name: "Установка опор и подвесок", unit: "шт" },
  { name: "Монтаж оборудования", unit: "шт" },
  { name: "Изоляция трубопровода", unit: "м.п." },
  { name: "Испытание трубопровода", unit: "м.п." },
  { name: "Прокладка кабеля", unit: "м.п." },
  { name: "Монтаж электрощита", unit: "шт" },
];

const EMPTY_FORM = {
  work_date: new Date().toISOString().split("T")[0],
  work_name: "",
  unit: "",
  volume: "",
  location: "",
  note: "",
};

export default function WorkVolumes() {
  const [items, setItems] = useState<WorkVolume[]>([]);
  const [cumulative, setCumulative] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<"log" | "summary">("log");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { items: list, cumulative: cum } = await fetchWorkVolumes();
      setItems(list);
      setCumulative(cum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.work_name.trim() || !form.unit.trim() || !form.volume) {
      setFormError("Заполните вид работ, единицу измерения и объём");
      return;
    }
    const vol = parseFloat(form.volume);
    if (isNaN(vol) || vol <= 0) { setFormError("Введите корректный объём > 0"); return; }

    setSaving(true);
    setFormError("");
    try {
      await addWorkVolume({
        work_date: form.work_date,
        work_name: form.work_name,
        unit: form.unit,
        volume: vol,
        location: form.location || undefined,
        note: form.note || undefined,
      });
      await load();
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch(getExcelUrl(), { headers: getExcelHeaders() });
      if (!res.ok) throw new Error("Ошибка экспорта");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `объёмы_работ_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка экспорта");
    } finally {
      setDownloading(false);
    }
  }

  const totalItems = items.length;
  const uniqueWorks = Object.keys(cumulative).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Объёмы работ</h1>
          <div className="text-xs text-white/40 mt-0.5">{totalItems} записей · {uniqueWorks} видов работ</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={downloading || items.length === 0}
            className="bg-green-600/80 hover:bg-green-500 disabled:opacity-40 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            {downloading
              ? <><Icon name="Loader" size={13} className="animate-spin" />Excel...</>
              : <><Icon name="FileDown" size={13} />Excel</>}
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowForm(true); }}
            className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Icon name="Plus" size={14} />
            Добавить
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
          <Icon name="AlertCircle" size={14} />{error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#13151c] rounded-xl p-1 border border-white/5">
        {[
          { key: "log", label: "Журнал записей", icon: "List" },
          { key: "summary", label: "Нарастающий итог", icon: "BarChart2" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "log" | "summary")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* LOG TAB */}
      {tab === "log" && (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormError(""); setShowForm(true); }}
            className="w-full border-2 border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center gap-3 text-white/30 hover:border-orange-500/30 hover:text-orange-400 transition-all"
          >
            <Icon name="ClipboardList" size={36} />
            <span className="text-sm">Нет записей — нажмите чтобы добавить</span>
          </button>
        ) : (
          <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
            <div className="hidden md:grid grid-cols-[90px_1fr_90px_70px_120px] px-4 py-2 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider gap-2">
              <span>Дата</span>
              <span>Вид работ</span>
              <span className="text-center">Объём</span>
              <span className="text-center">Ед.</span>
              <span>Место / прораб</span>
            </div>
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3 border-b border-white/5 last:border-0 flex flex-col md:grid md:grid-cols-[90px_1fr_90px_70px_120px] md:items-center gap-1 md:gap-2">
                <div className="text-xs text-white/50">{new Date(item.work_date + "T00:00:00").toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })}</div>
                <div>
                  <div className="text-sm font-medium">{item.work_name}</div>
                  {item.note && <div className="text-xs text-white/30 truncate">{item.note}</div>}
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-orange-400">{item.volume}</span>
                </div>
                <div className="text-center text-xs text-white/50">{item.unit}</div>
                <div className="text-xs text-white/40">
                  {item.location && <div className="truncate">{item.location}</div>}
                  <div className="text-white/25">{item.user_name}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* SUMMARY TAB */}
      {tab === "summary" && (
        <div className="space-y-3">
          <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold">Нарастающий итог по видам работ</span>
              <button
                onClick={handleExport}
                disabled={downloading}
                className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-all"
              >
                <Icon name="Download" size={12} />
                Скачать Excel
              </button>
            </div>
            {Object.keys(cumulative).length === 0 ? (
              <div className="py-10 text-center text-white/30 text-sm">Нет данных</div>
            ) : (
              Object.entries(cumulative)
                .sort((a, b) => b[1] - a[1])
                .map(([wname, total]) => {
                  const unit = items.find((i) => i.work_name === wname)?.unit || "";
                  const maxVal = Math.max(...Object.values(cumulative));
                  const pct = maxVal > 0 ? (total / maxVal) * 100 : 0;
                  return (
                    <div key={wname} className="px-4 py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{wname}</span>
                        <span className="text-sm font-bold text-orange-400">
                          {total % 1 === 0 ? total : total.toFixed(2)} <span className="text-xs text-white/40 font-normal">{unit}</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Excel hint */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
            <Icon name="FileSpreadsheet" size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-green-300">Экспорт в Excel</div>
              <div className="text-xs text-white/50 mt-0.5">
                Файл содержит 2 листа: полный журнал записей и сводную таблицу нарастающего итога по всем видам работ.
              </div>
              <button
                onClick={handleExport}
                disabled={downloading || items.length === 0}
                className="mt-2 text-xs bg-green-600/80 hover:bg-green-500 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
              >
                {downloading
                  ? <><Icon name="Loader" size={12} className="animate-spin" />Формирую...</>
                  : <><Icon name="Download" size={12} />Скачать work_volumes.xlsx</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl border border-white/10 p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Добавить объём работ</h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 transition-all">
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Quick picks */}
            <div>
              <label className="text-xs text-white/40 mb-2 block">Быстрый выбор</label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_WORKS.map((w) => (
                  <button
                    key={w.name}
                    onClick={() => setForm((f) => ({ ...f, work_name: w.name, unit: w.unit }))}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all border ${
                      form.work_name === w.name
                        ? "bg-orange-500/20 border-orange-500/30 text-orange-400"
                        : "bg-white/5 border-white/5 text-white/40 hover:bg-white/8"
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-white/40 mb-1.5 block">Вид работ</label>
                <input
                  value={form.work_name}
                  onChange={(e) => setForm((f) => ({ ...f, work_name: e.target.value }))}
                  placeholder="Монтаж трубопровода Ду100"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Объём</label>
                <input
                  value={form.volume}
                  onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))}
                  placeholder="12.5"
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Ед. измерения</label>
                <input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="м.п., шт, кг..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Дата</label>
                <input
                  value={form.work_date}
                  onChange={(e) => setForm((f) => ({ ...f, work_date: e.target.value }))}
                  type="date"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Место</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Этаж 2, ось 3-5"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/40 mb-1.5 block">Примечание</label>
                <input
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Дополнительно..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-xs text-red-400">
                <Icon name="AlertCircle" size={13} />{formError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-sm py-2.5 rounded-xl transition-all">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Icon name="Loader" size={14} className="animate-spin" />Сохраняю...</>
                  : <><Icon name="Check" size={14} />Сохранить</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
