<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>User Home</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; background: #0b1220; color: #e5e7eb; }
    .wrap { max-width: 860px; margin: 0 auto; padding: 28px; }
    .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(148,163,184,0.2); border-radius: 16px; padding: 18px; }
    h1 { margin: 0 0 8px; font-size: 20px; }
    p { margin: 0 0 14px; color: #cbd5e1; }
    .meta { font-size: 13px; color: #94a3b8; margin-bottom: 14px; }
    .btn {
      display: inline-block;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(148,163,184,0.35);
      background: rgba(255,255,255,0.08);
      color: #e5e7eb;
      cursor: pointer;
      font-weight: 700;
    }
    form { display: inline; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Halo, {{ auth()->user()->name }}</h1>
      <div class="meta">Role: <b>{{ auth()->user()->role }}</b></div>
      <p>Halaman user belum dibuat. Nanti kalau sudah siap, kita bikin dashboard khusus user di sini.</p>

      <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button class="btn" type="submit">Logout</button>
      </form>
    </div>
  </div>
</body>
</html>

