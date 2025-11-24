# Guia de Deploy - DETE v3.0

## 🚀 Opções de Deploy

Este guia cobre múltiplas opções de deploy para o DETE v3.0.

---

## ✅ Pré-requisitos

- Sistema DETE v3.0 (clone do repositório)
- Credenciais Google Cloud configuradas
- Domínio (opcional, mas recomendado)
- Certificado SSL (obrigatório para PWA)

---

## 1️⃣ Vercel (Recomendado - Grátis)

### Características
- ✅ Deploy automático via Git
- ✅ HTTPS automático
- ✅ Edge network global
- ✅ Tier gratuito generoso

### Passo a Passo

1. **Criar conta** em [vercel.com](https://vercel.com)

2. **Instalar Vercel CLI**
```bash
npm install -g vercel
```

3. **Configurar projeto**

Crie `vercel.json` na raiz:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

4. **Deploy**
```bash
vercel
```

5. **Configurar domínio customizado** (opcional)
```bash
vercel domains add seudominio.com
```

6. **Atualizar Google Cloud Console**
- Adicione a URL do Vercel nas "Authorized JavaScript origins"
- Exemplo: `https://dete-sistema-v3.vercel.app`

---

## 2️⃣ Netlify (Grátis)

### Características
- ✅ Deploy automático via Git
- ✅ HTTPS automático
- ✅ Forms e Functions (se precisar no futuro)

### Passo a Passo

1. **Criar conta** em [netlify.com](https://netlify.com)

2. **Criar `netlify.toml`** na raiz:
```toml
[build]
  publish = "."
  command = "echo 'No build needed'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/service-worker.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Content-Type = "application/manifest+json"
```

3. **Deploy via Git**
- Conecte repositório GitHub
- Netlify detecta automaticamente
- Deploy instantâneo

4. **Configurar domínio** (opcional)
- Domain settings > Add custom domain

---

## 3️⃣ GitHub Pages (Grátis)

### Características
- ✅ Hospedagem grátis
- ✅ HTTPS automático
- ⚠️ Apenas sites estáticos

### Passo a Passo

1. **Habilitar GitHub Pages**
- Repositório > Settings > Pages
- Source: Deploy from a branch
- Branch: `main` / folder: `/root`
- Save

2. **Criar `.nojekyll`** na raiz:
```bash
touch .nojekyll
```

3. **Commit e push**
```bash
git add .nojekyll
git commit -m "feat: Configure GitHub Pages"
git push
```

4. **Aguardar deploy** (1-2 minutos)
- URL: `https://username.github.io/dete-sistema-v3/`

5. **Atualizar `index.html`** se estiver em subpasta:
```html
<!-- Alterar caminhos absolutos para relativos -->
<link rel="manifest" href="./manifest.json">
<script src="./js/app.js"></script>
```

---

## 4️⃣ Firebase Hosting

### Características
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Integração com Firebase (para push notifications)

### Passo a Passo

1. **Instalar Firebase CLI**
```bash
npm install -g firebase-tools
```

2. **Login**
```bash
firebase login
```

3. **Inicializar projeto**
```bash
firebase init hosting
```

Respostas:
- Use existing project ou create new
- Public directory: `.` (raiz)
- Configure as SPA: `Yes`
- GitHub deploys: `No` (por enquanto)

4. **Deploy**
```bash
firebase deploy --only hosting
```

5. **URL**: `https://projeto-id.web.app`

---

## 5️⃣ Servidor Próprio (VPS/Dedicated)

### Usando Nginx

1. **Instalar Nginx**
```bash
sudo apt update
sudo apt install nginx
```

2. **Copiar arquivos**
```bash
sudo mkdir -p /var/www/dete
sudo cp -r * /var/www/dete/
sudo chown -R www-data:www-data /var/www/dete
```

3. **Configurar Nginx**

Criar `/etc/nginx/sites-available/dete`:
```nginx
server {
    listen 80;
    server_name seudominio.com;
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
    
    # Root directory
    root /var/www/dete;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Service Worker headers
    location /service-worker.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
        add_header Service-Worker-Allowed "/";
    }
    
    # Manifest headers
    location /manifest.json {
        add_header Content-Type "application/manifest+json";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

4. **Habilitar site**
```bash
sudo ln -s /etc/nginx/sites-available/dete /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

5. **Obter SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

---

## 6️⃣ Docker

### Dockerfile

Criar `Dockerfile`:
```dockerfile
FROM nginx:alpine

# Copiar arquivos
COPY . /usr/share/nginx/html/

# Configurar Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

Criar `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /service-worker.js {
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }
}
```

### Build e Run

```bash
# Build
docker build -t dete-sistema .

# Run
docker run -d -p 8080:80 dete-sistema
```

### Docker Compose

Criar `docker-compose.yml`:
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Executar:
```bash
docker-compose up -d
```

---

## 🔒 Checklist Pós-Deploy

- [ ] HTTPS configurado e funcionando
- [ ] Service Worker registrando corretamente
- [ ] Manifest.json sendo servido com Content-Type correto
- [ ] PWA instalando no mobile/desktop
- [ ] Google OAuth funcionando com URL de produção
- [ ] Sincronização com Google Sheets funcionando
- [ ] Upload para Google Drive funcionando
- [ ] Modo offline funcionando
- [ ] Push notifications funcionando (se configurado)
- [ ] Performance otimizada (Lighthouse > 90)

---

## 📈 Monitoramento

### Google Analytics

Adicionar no `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Sentry (Error Tracking)

1. Criar conta em [sentry.io](https://sentry.io)
2. Criar projeto
3. Adicionar SDK:

```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: 'YOUR_DSN_HERE',
    environment: 'production'
  });
</script>
```

---

## 🐛 Troubleshooting

### PWA não instala

**Causa**: HTTPS não configurado ou Service Worker com erro

**Solução**:
1. Verifique HTTPS
2. Abra DevTools > Application > Service Workers
3. Verifique erros

### Google OAuth redireciona para localhost

**Causa**: URLs autorizadas incorretas

**Solução**:
1. Google Cloud Console > Credentials
2. Edite OAuth Client ID
3. Adicione URL de produção
4. Remova localhost se não precisar mais

### Service Worker não atualiza

**Causa**: Cache agressivo

**Solução**:
1. Altere `CACHE_NAME` em `service-worker.js`
2. Redeploy
3. Usuários verão atualização automaticamente

---

**Última atualização:** Novembro 2025