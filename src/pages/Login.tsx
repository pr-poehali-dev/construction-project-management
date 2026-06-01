import { useState } from "react";
import Icon from "@/components/ui/icon";
import { apiLogin, saveToken } from "@/lib/auth";
import type { User } from "@/lib/auth";

interface Props {
  onLogin: (user: User, token: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await apiLogin(phone.trim(), password);
      saveToken(token);
      onLogin(user, token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 font-ibm">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
            <Icon name="HardHat" size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">СтройКонтроль</h1>
          <p className="text-sm text-white/40 mt-1">Управление строительными проектами</p>
        </div>

        {/* Form */}
        <div className="bg-[#13151c] rounded-2xl border border-white/5 p-6 space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-2 block">Номер телефона</label>
            <div className="relative">
              <Icon name="Phone" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 900 111 22 33"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 mb-2 block">Пароль</label>
            <div className="relative">
              <Icon name="Lock" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon name="Loader" size={16} className="animate-spin" />
                Вход...
              </>
            ) : (
              <>
                <Icon name="LogIn" size={16} />
                Войти
              </>
            )}
          </button>
        </div>

        {/* Demo hint */}
        <div className="mt-4 bg-white/3 border border-white/5 rounded-xl p-4 space-y-2">
          <div className="text-xs text-white/30 font-medium mb-2">Демо-доступ (пароль для всех: 1234)</div>
          {[
            { name: "Смирнов В.А.", phone: "+79001112233", role: "Прораб" },
            { name: "Коваль И.Р.", phone: "+79002223344", role: "Прораб" },
            { name: "Ковалёв Д.С.", phone: "+79003334455", role: "Инженер" },
          ].map((u) => (
            <button
              key={u.phone}
              onClick={() => { setPhone(u.phone); setPassword("1234"); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center justify-center">
                  {u.name[0]}
                </div>
                <span className="text-xs text-white/70">{u.name}</span>
              </div>
              <span className="text-[10px] text-white/30">{u.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
