import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { fetchPhotos, uploadPhoto, fileToBase64 } from "@/lib/mediaApi";
import type { Photo } from "@/lib/mediaApi";

const CATEGORIES = [
  { key: "", label: "Все фото" },
  { key: "attendance", label: "Табель / явка" },
  { key: "work", label: "Производство работ" },
  { key: "safety", label: "Охрана труда" },
  { key: "issue", label: "Замечания" },
  { key: "report", label: "Дневной отчёт" },
  { key: "general", label: "Общее" },
];

interface Props {
  defaultCategory?: string;
}

export default function PhotoAlbum({ defaultCategory = "" }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [category, setCategory] = useState(defaultCategory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // upload state
  const [showUpload, setShowUpload] = useState(false);
  const [upCategory, setUpCategory] = useState("general");
  const [upCaption, setUpCaption] = useState("");
  const [upFile, setUpFile] = useState<File | null>(null);
  const [upPreview, setUpPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [upError, setUpError] = useState("");

  // lightbox
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, [category]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { photos: list } = await fetchPhotos(category || undefined);
      setPhotos(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpFile(file);
    const url = URL.createObjectURL(file);
    setUpPreview(url);
  }

  async function handleUpload() {
    if (!upFile) { setUpError("Выберите файл"); return; }
    setUploading(true);
    setUpError("");
    try {
      const b64 = await fileToBase64(upFile);
      const photo = await uploadPhoto(b64, upFile.type, upCategory, upCaption);
      setPhotos((prev) => [photo, ...prev]);
      setShowUpload(false);
      setUpFile(null);
      setUpPreview("");
      setUpCaption("");
    } catch (e: unknown) {
      setUpError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  function openUploadModal(cat = "general") {
    setUpCategory(cat);
    setUpCaption("");
    setUpFile(null);
    setUpPreview("");
    setUpError("");
    setShowUpload(true);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Фотоальбом</h1>
          <div className="text-xs text-white/40 mt-0.5">{photos.length} фотографий</div>
        </div>
        <button
          onClick={() => openUploadModal()}
          className="bg-orange-500 hover:bg-orange-400 text-white text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
        >
          <Icon name="Camera" size={14} />
          Добавить фото
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg transition-all ${
              category === c.key
                ? "bg-orange-500 text-white"
                : "bg-[#13151c] text-white/40 hover:bg-white/5 border border-white/5"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
          <Icon name="AlertCircle" size={14} />{error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <button
          onClick={() => openUploadModal()}
          className="w-full border-2 border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center gap-3 text-white/30 hover:border-orange-500/30 hover:text-orange-400 transition-all"
        >
          <Icon name="ImagePlus" size={36} />
          <span className="text-sm">Нет фотографий — нажмите чтобы добавить</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="relative group aspect-square rounded-xl overflow-hidden bg-[#13151c] border border-white/5 hover:border-orange-500/30 transition-all"
            >
              <img
                src={photo.cdn_url}
                alt={photo.caption || ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <div className="text-[10px] text-white/80 font-medium truncate">{photo.caption || photo.user_name}</div>
                <div className="text-[9px] text-white/40">{new Date(photo.created_at).toLocaleDateString("ru-RU")}</div>
              </div>
              {/* category badge */}
              <div className="absolute top-1.5 left-1.5">
                <span className="text-[9px] bg-black/60 text-white/70 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {CATEGORIES.find((c) => c.key === photo.category)?.label || photo.category}
                </span>
              </div>
            </button>
          ))}

          {/* Add more */}
          <button
            onClick={() => openUploadModal()}
            className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-white/20 hover:border-orange-500/30 hover:text-orange-400 transition-all"
          >
            <Icon name="Plus" size={24} />
            <span className="text-[10px]">Добавить</span>
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowUpload(false)}
        >
          <div className="w-full max-w-md bg-[#1a1d27] rounded-2xl border border-white/10 p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Загрузить фото</h2>
              <button onClick={() => setShowUpload(false)} className="text-white/30 hover:text-white/60 transition-all">
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* File picker */}
            <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
            {upPreview ? (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black/30">
                <img src={upPreview} alt="" className="w-full h-full object-contain" />
                <button
                  onClick={() => { setUpFile(null); setUpPreview(""); if (fileInput.current) fileInput.current.value = ""; }}
                  className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white/70 hover:text-white"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInput.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-xl py-8 flex flex-col items-center gap-2 text-white/30 hover:border-orange-500/30 hover:text-orange-400 transition-all"
              >
                <Icon name="Camera" size={28} />
                <span className="text-sm">Сфотографировать или выбрать из галереи</span>
              </button>
            )}

            {/* Category */}
            <div>
              <label className="text-xs text-white/40 mb-2 block">Категория</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => c.key).map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setUpCategory(c.key)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                      upCategory === c.key
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/8"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Подпись (необязательно)</label>
              <input
                value={upCaption}
                onChange={(e) => setUpCaption(e.target.value)}
                placeholder="Что изображено на фото..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>

            {upError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-xs text-red-400">
                <Icon name="AlertCircle" size={13} />{upError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowUpload(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-sm py-2.5 rounded-xl transition-all">
                Отмена
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !upFile}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><Icon name="Loader" size={14} className="animate-spin" />Загружаю...</>
                  : <><Icon name="Upload" size={14} />Загрузить</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.cdn_url} alt={lightbox.caption || ""} className="w-full rounded-2xl max-h-[80vh] object-contain" />
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                {lightbox.caption && <div className="text-sm font-medium text-white">{lightbox.caption}</div>}
                <div className="text-xs text-white/40 mt-0.5">
                  {lightbox.user_name} · {new Date(lightbox.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-lg flex-shrink-0">
                {CATEGORIES.find((c) => c.key === lightbox.category)?.label}
              </span>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
