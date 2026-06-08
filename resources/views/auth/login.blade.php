<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login - Flood Monitoring</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Liberation Sans", sans-serif;
      background: radial-gradient(1200px 600px at 20% 0%, #dbeafe 0%, transparent 60%),
                  radial-gradient(900px 500px at 100% 40%, #f5d0fe 0%, transparent 55%),
                  #0b1220;
      color: #0f172a;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 28px;
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(148,163,184,0.35);
      border-radius: 18px;
      box-shadow: 0 14px 45px rgba(0,0,0,0.25);
      overflow: hidden;
    }
    .top {
      padding: 22px 22px 14px;
      background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(168,85,247,0.10));
      border-bottom: 1px solid rgba(148,163,184,0.35);
    }
    .title { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.2px; }
    .sub { margin: 6px 0 0; color: #475569; font-size: 13px; }
    form { padding: 18px 22px 22px; }
    .field { margin-bottom: 12px; }
    label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #0f172a; }
    input[type="email"], input[type="password"] {
      width: 100%;
      padding: 11px 12px;
      border-radius: 12px;
      border: 1px solid rgba(148,163,184,0.6);
      background: #fff;
      outline: none;
      font-size: 14px;
    }
    input:focus { border-color: rgba(59,130,246,0.9); box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 10px 0 14px; }
    .chk { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; }
    .btn {
      width: 100%;
      padding: 11px 14px;
      border-radius: 12px;
      border: 0;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: #fff;
      font-weight: 800;
      cursor: pointer;
      font-size: 14px;
    }
    .btn:hover { filter: brightness(1.05); }
    .err {
      background: rgba(239,68,68,0.10);
      border: 1px solid rgba(239,68,68,0.30);
      color: #991b1b;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .hint {
      margin-top: 12px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    code { background: rgba(15,23,42,0.06); padding: 2px 6px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="top">
      <h1 class="title">Login</h1>
      <p class="sub">Masuk untuk mengakses dashboard.</p>
    </div>
    <form method="POST" action="{{ route('login.post') }}">
      @csrf

      @if ($errors->any())
        <div class="err">
          {{ $errors->first() }}
        </div>
      @endif

      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" name="email" value="{{ old('email') }}" autocomplete="email" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" type="password" name="password" autocomplete="current-password" required />
      </div>

      <div class="row">
        <label class="chk">
          <input type="checkbox" name="remember" value="1" {{ old('remember') ? 'checked' : '' }} />
          Ingat saya
        </label>
      </div>

      <button class="btn" type="submit">Masuk</button>

      <div class="hint">
        Setelah masuk, ringkasan ada di <code>/dashboard</code>. Admin: kelola perangkat &amp; data lewat
        <code>/monitoring/...</code> (menu sidebar).
      </div>
    </form>
  </div>
</body>
</html>

