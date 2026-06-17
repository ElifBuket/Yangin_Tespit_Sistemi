# IoT Yangın Tespit Sistemi - Frontend

React + Vite ile geliştirilmiş modern web arayüzü.

## 🚀 Kurulum

```bash
npm install
```

## 🏃 Çalıştırma

```bash
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacak.

## 🔧 Yapılandırma

`.env` dosyasını düzenleyin:

```env
VITE_API_URL=http://localhost:4000
```

## 📦 Teknolojiler

- React 18
- Vite
- React Router v6
- Axios
- Socket.IO Client
- Zustand (State Management)
- Tailwind CSS
- Recharts
- React Hot Toast
- Lucide Icons
- date-fns

## 🎨 Özellikler

### Kullanıcı Sayfaları
- Login/Register
- Dashboard (Canlı gaz verileri)
- Cihaz Yönetimi
- Geçmiş Veriler
- Arıza Bildirimi
- Profil

### Admin Sayfaları
- Admin Dashboard
- Kullanıcı Yönetimi (Adresler dahil)
- Arıza Yönetimi

## 🔐 CORS Yapılandırması

Backend'de CORS zaten yapılandırıldı:
- `http://localhost:3000` (React)
- `http://localhost:5173` (Vite)

## 📱 Responsive

Tüm sayfalar mobil uyumlu.

## 🎯 Build

```bash
npm run build
```

Build dosyaları `dist/` klasöründe oluşur.
