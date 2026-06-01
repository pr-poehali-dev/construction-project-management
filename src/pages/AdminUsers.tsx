import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchUsers, createUser, updateUser, deleteUser } from "@/lib/adminApi";
import type { UserRecord } from "@/lib/adminApi";

const ROLE_LABELS: Record<string, string> = {
  foreman: "Прораб",
  engineer: "Инженер",
  admin: "Администратор",
};

const ROLE_COLORS: Record<string, string> = {
  foreman: "bg-orange-500/15 text-orange-400",
  engineer: "bg-blue-500/15 text-blue-400",
  admin: "bg-purple-500/15 text-purple-400",
};

const EMPTY_FORM = { name: "", phone: "", password: "", role: "foreman" };

interface Props {
  currentUserId: number;
}

export default function AdminUsers({ currentUserId }: Props) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await fetchUsers();
      setUsers(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowModal(true);
  }

  function openEdit(u: UserRecord) {
    setEditUser(u);
    setForm({ name: u.name, phone: u.phone, password: "", role: u.role });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError("Заполните имя и телефон");
      return;
    }
    if (!editUser && !form.password.trim()) {
      setFormError("Введите пароль для нового пользователя");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (editUser) {
        await updateUser({ id: editUser.id, name: form.name, phone: form.phone, role: form.role, password: form.password || undefined });
        setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, name: form.name, phone: form.phone, role: form.role as UserRecord["role"] } : u));
      } else {
        const created = await createUser({ name: form.name, phone: form.phone, password: form.password, role: form.role });
        setUsers((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка удаления");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Пользователи</h1>
          <div className="text-xs text-white/40 mt-0.5">{users.length} аккаунтов в системе</div>
        </div>
        <button
          onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
        >
          <Icon name="UserPlus" size={14} />
          Добавить
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
          <Icon name="AlertCircle" size={14} />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Прорабы", count: users.filter((u) => u.role === "foreman").length, color: "orange" },
          { label: "Инженеры", count: users.filter((u) => u.role === "engineer").length, color: "blue" },
          { label: "Администраторы", count: users.filter((u) => u.role === "admin").length, color: "purple" },
        ].map((s) => (
          <div key={s.label} className="bg-[#13151c] rounded-xl border border-white/5 p-3 text-center">
            <div className={`text-2xl font-bold ${s.color === "orange" ? "text-orange-400" : s.color === "blue" ? "text-blue-400" : "text-purple-400"}`}>
              {s.count}
            </div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* User list */}
      <div className="bg-[#13151c] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-white/30 text-sm">Нет пользователей</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="px-4 py-3.5 border-b border-white/5 last:border-0 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                u.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                u.role === "engineer" ? "bg-blue-500/20 text-blue-400" :
                "bg-orange-500/20 text-orange-400"
              }`}>
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{u.name}</span>
                  {u.id === currentUserId && (
                    <span className="text-[10px] bg-white/5 text-white/30 px-1.5 py-0.5 rounded">Вы</span>
                  )}
                </div>
                <div className="text-xs text-white/40">{u.phone}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[u.role] || "bg-white/5 text-white/40"}`}>
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(u)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-all"
                >
                  <Icon name="Pencil" size={13} />
                </button>
                <button
                  onClick={() => u.id !== currentUserId && setDeleteTarget(u)}
                  disabled={u.id === currentUserId}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Icon name="Trash2" size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl border border-white/10 p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">{editUser ? "Редактировать пользователя" : "Новый пользователь"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/60 transition-all">
                <Icon name="X" size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Имя и фамилия</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Смирнов В.А."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Телефон</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+79001234567"
                  type="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">
                  {editUser ? "Новый пароль (оставьте пустым, чтобы не менять)" : "Пароль"}
                </label>
                <input
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editUser ? "••••••••" : "Минимум 4 символа"}
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Роль</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "foreman", label: "Прораб", icon: "HardHat" },
                    { value: "engineer", label: "Инженер", icon: "Ruler" },
                    { value: "admin", label: "Администратор", icon: "ShieldCheck" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-all ${
                        form.role === r.value
                          ? r.value === "admin" ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                            : r.value === "engineer" ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                            : "bg-orange-500/15 border-orange-500/30 text-orange-400"
                          : "bg-white/3 border-white/10 text-white/40 hover:bg-white/5"
                      }`}
                    >
                      <Icon name={r.icon} size={16} />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-xs text-red-400">
                <Icon name="AlertCircle" size={13} />
                {formError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-sm py-2.5 rounded-xl transition-all">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {saving ? <><Icon name="Loader" size={14} className="animate-spin" />Сохраняю...</> : <><Icon name="Check" size={14} />{editUser ? "Сохранить" : "Создать"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#1a1d27] rounded-2xl border border-white/10 p-5 space-y-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <Icon name="Trash2" size={18} className="text-red-400" />
              </div>
              <div>
                <div className="text-sm font-bold">Удалить пользователя?</div>
                <div className="text-xs text-white/50 mt-1">
                  <span className="text-white">{deleteTarget.name}</span> будет удалён из системы. Все активные сессии будут завершены.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-sm py-2.5 rounded-xl transition-all">
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {deleting ? <><Icon name="Loader" size={14} className="animate-spin" />Удаляю...</> : <><Icon name="Trash2" size={14} />Удалить</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
