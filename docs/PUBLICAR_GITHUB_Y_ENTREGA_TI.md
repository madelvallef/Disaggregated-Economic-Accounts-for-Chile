# Publicacion en GitHub y paquete para TI

Runbook reproducible para publicar la pagina y generar una entrega de la version
publicable. La fuente editable es `sitio.html`; `dist/` es un artefacto generado.

## 0. Ubicacion y alcance

Ejecutar todos los comandos desde:

```powershell
Set-Location -LiteralPath "C:\Users\fcarr\Dropbox\CORFO\CORFO_2026\7_Webpage\Disaggregated Economic Accounts for Chile v2"
```

El repositorio es:

```text
https://github.com/madelvallef/Disaggregated-Economic-Accounts-for-Chile
```

La pagina publica es:

```text
https://madelvallef.github.io/Disaggregated-Economic-Accounts-for-Chile/
```

La publicacion usa solamente el contenido generado en `dist/`. No se suben
`_archivo/`, capturas, prototipos ni la carpeta de trabajo completa al sitio.

## 1. Comprobar autenticacion y cambios

Antes de modificar o publicar, revisar el estado del repositorio:

```powershell
git status --short --branch
git remote -v
gh auth status
```

Si `gh auth status` indica que no hay sesion, autenticar GitHub con:

```powershell
gh auth login
```

No usar `git add .` sin revisar antes `git status`. Otra IA debe separar los
cambios propios de la iteracion de cualquier cambio previo del usuario.

## 2. Validar y reconstruir el sitio

Instalar dependencias si es una maquina nueva:

```powershell
npm.cmd install
npx playwright install chromium
```

Ejecutar el ciclo completo:

```powershell
npm.cmd run preproduction
```

Este comando ejecuta, en orden:

1. `validate`: encoding UTF-8, recursos locales y estructura.
2. `qa:data`: consistencia de datos y metricas.
3. `build`: reconstruye `dist/` desde `sitio.html` y las carpetas publicas.
4. `qa:intensive`: recorrido Playwright desktop/mobile.

Si solo se necesita reconstruir el artefacto:

```powershell
npm.cmd run build
```

Despues del build, confirmar que `dist/` contiene como minimo:

```text
dist/
  index.html
  web_materiales/
  vendor/
  downloads/
  uploads/
  _headers
  .htaccess
  nginx-security-headers.conf
```

No editar `dist/` manualmente: el siguiente `npm.cmd run build` reemplaza esos
cambios.

## 3. Publicar en GitHub Pages

Revisar exactamente que se va a incluir:

```powershell
git status --short
git diff --stat
git diff -- sitio.html web_materiales scripts qa package.json .github docs
```

Agregar solo los archivos correspondientes a la iteracion. Por ejemplo:

```powershell
git add sitio.html web_materiales scripts qa package.json .github docs
git diff --cached --stat
```

Pedir aprobacion explicita antes de crear el commit y hacer push. Luego:

```powershell
git commit -m "Actualiza sitio publico"
git push origin main
```

El workflow `.github/workflows/deploy-pages.yml` se activa al hacer push a
`main`. En GitHub Actions vuelve a validar, reconstruye `dist/`, ejecuta QA y
publica el artefacto de `dist/`. Por eso no es necesario versionar `dist/` ni
hacerle push manualmente.

Verificar el despliegue:

```powershell
gh run list --workflow deploy-pages.yml --limit 5
```

Cuando exista un `RUN_ID` nuevo:

```powershell
gh run watch RUN_ID
```

Finalmente abrir la URL publica en desktop y movil, idealmente agregando una
recarga completa para evitar cache del navegador.

## 4. Generar el paquete para TI

El paquete debe contener una carpeta raiz llamada `CED-cuentas-desagregadas/`
con el contenido de `dist/`, no la carpeta completa del proyecto. Se usa una
carpeta temporal fuera de Dropbox porque `Compress-Archive` puede fallar cuando
Dropbox mantiene bloqueadas fuentes o archivos grandes.

```powershell
$project = "C:\Users\fcarr\Dropbox\CORFO\CORFO_2026\7_Webpage\Disaggregated Economic Accounts for Chile v2"
$parent = Split-Path -Parent $project
$date = Get-Date -Format "yyyy-MM-dd"
$temp = Join-Path $env:TEMP "ced-package-$date"
$packageRoot = Join-Path $temp "CED-cuentas-desagregadas"
$zip = Join-Path $parent "CED-cuentas-desagregadas_TI_$date.zip"

if (Test-Path -LiteralPath $temp) {
  Remove-Item -LiteralPath $temp -Recurse -Force
}
New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
Copy-Item -Path (Join-Path $project "dist\*") -Destination $packageRoot -Recurse -Force

if (Test-Path -LiteralPath $zip) {
  Remove-Item -LiteralPath $zip -Force
}
Compress-Archive -Path $packageRoot -DestinationPath $zip -CompressionLevel Optimal

Get-Item -LiteralPath $zip | Select-Object FullName, Length, LastWriteTime
Get-FileHash -LiteralPath $zip -Algorithm SHA256
```

El resultado queda en la carpeta padre del proyecto, por ejemplo:

```text
C:\Users\fcarr\Dropbox\CORFO\CORFO_2026\7_Webpage\CED-cuentas-desagregadas_TI_2026-07-30.zip
```

Comprobar la estructura sin confiar solamente en el nombre del archivo:

```powershell
$check = Join-Path $env:TEMP "ced-package-check-$date"
if (Test-Path -LiteralPath $check) {
  Remove-Item -LiteralPath $check -Recurse -Force
}
Expand-Archive -LiteralPath $zip -DestinationPath $check
Test-Path (Join-Path $check "CED-cuentas-desagregadas\index.html")
Get-ChildItem -LiteralPath (Join-Path $check "CED-cuentas-desagregadas") -Force
```

Actualizar `docs/ENTREGA_TI.md` con la fecha, tamano y SHA-256 reales del nuevo
ZIP. No inventar esos valores. La entrega para TI no necesita entrar al commit
ni al repositorio publico: se entrega como archivo separado.

## 5. Contenido que debe recibir TI

TI debe copiar el contenido de `CED-cuentas-desagregadas/` como raiz de la
subruta publica. El sitio es estatico y no requiere API, login, base de datos,
Node, PHP ni servidor de aplicacion.

Debe conservarse:

- `index.html`.
- `web_materiales/`, `vendor/`, `downloads/` y `uploads/`.
- Solo una configuracion de cabeceras: `.htaccess` para Apache,
  `nginx-security-headers.conf` para Nginx o `_headers` para Netlify/Cloudflare.

Las plantillas `operacion/registros/*.xlsx` no se incluyen en el paquete web ni
deben hacerse publicas. Son destinos internos para registrar solicitudes si TI
configura los endpoints de formularios.

## 6. Comprobaciones finales

- `npm.cmd run preproduction` termina correctamente.
- La accion de GitHub Pages termina en estado `success`.
- La URL publica abre Home, Explorar, Datos, Trabajo de Investigacion y Otros
  Esfuerzos en ES y EN.
- Las visualizaciones funcionan en desktop y movil.
- El ZIP abre, contiene una sola carpeta raiz y su SHA-256 fue anotado.
- Si las descargas estan desactivadas en la interfaz, verificar que la entrega
  TI refleje esa decision. En un sitio estatico, conservar archivos en
  `downloads/` significa que sus URLs directas siguen siendo accesibles aunque
  el formulario no inicie la descarga.

## Referencias

- [README del proyecto](../README.md)
- [Checklist de preproduccion](PREPRODUCCION.md)
- [Formato de entrega para TI](ENTREGA_TI.md)
- [Workflow de GitHub Pages](../.github/workflows/deploy-pages.yml)

