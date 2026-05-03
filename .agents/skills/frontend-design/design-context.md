# Design Context — 11

> Documento de contexto de diseño para Claude Design. Vive al lado del PRD/Product Map y se actualiza cuando cambian decisiones globales de UX o se incorporan nuevos componentes recurrentes.
>
> **Última actualización:** 2026-04-29 — basado en `product-map.md v1.0` (status: Draft).

---

## 1. Producto en una línea

App web sin login para que fans del fútbol armen su 11 ideal del torneo (Modo Solo) o lo elijan en tiempo real con amigos por draft (Modo Draft), y compartan el resultado por WhatsApp.

## 2. Personas

**U-01 — Fan casual**
Llega por un link de WhatsApp. Quiere "entrar, armar, compartir" — esa es literalmente la frase del PRD. Mobile-first, probablemente está en el subte o en el sillón. Tiempo disponible: 5 min. Tolerancia cero a configuración previa: defaults o nada.

**U-02 — Organizador / participante de draft**
El que arma el grupo. Espera configurabilidad como parte del placer (snake, modo país, presupuesto custom), pero también valora arrancar rápido. Suele tener 2-8 amigos esperando. Tolera ~30 segundos de setup. Mobile primario.

**U-03 — Espectador**
Recibe un link de equipo de otra persona. No vino a jugar, vino a ver. Riesgo declarado en PRD: "espectador confundido" — necesita que la pantalla sea obviamente distinta de la de armado, sin parecer una versión deshabilitada.

## 3. Principios de UX globales

Decisiones de diseño se evalúan contra estos principios. Si dudás, ganan ellos.

1. **Cero auth, cero registro, cero tutorial.** No hay onboarding. Las micro-explicaciones (qué es "snake", "país al azar", "posiciones fijas") viven inline como tooltips en las pantallas donde aplican.
2. **Cero perfil, cero historial.** No existe "mis equipos guardados". La única persistencia local es idioma y último apodo usado. Lo demás vive en URLs públicas (`/t/{codigo}`).
3. **Mobile-first siempre.** Diseñar primero para 375px. El selector de jugadores es bottom sheet en mobile, no panel lateral. Desktop adapta, no manda.
4. **Defaults agresivos.** Toda configuración tiene un valor pre-cargado razonable. Modo Solo entra directo a cancha + selector con 4-3-3, posiciones fijas y presupuesto activado. El usuario solo toca lo que quiere cambiar.
5. **El reloj corre.** Armado de equipo: 5 min. Entrar a un draft: 30 seg. Cada pantalla debe restar pasos.
6. **Compartir es el cierre.** Toda experiencia termina en algo compartible (card o link público). El share sheet nativo es el botón primario al final del Modo Solo y del draft.
7. **El espectador es first-class citizen.** La página `/t/{codigo}` es una pantalla diseñada (vitrina), no una versión read-only del editor.
8. **Tensión social en el draft.** El draft es un evento, no un formulario en tiempo real. Animación de reveal por pick (~2s), countdown sincronizado, picks de los demás siempre visibles.
9. **Inmutabilidad de equipos confirmados.** No hay back-edit sobre equipos ya confirmados. Sí hay edit dentro del armado en curso. Esto es importante visualmente: la `/t/{codigo}` no debe sugerir que se puede editar.
10. **Internacionalización transparente.** Idioma se detecta del browser (en-* → inglés, resto → español). El toggle existe pero vive en footer/secundario, nunca en el flow principal.

## 4. Jerarquía visual por pantalla

Para low-fi: qué es lo más grande / arriba / con más peso visual.

| Pantalla | Primario | Secundario | Terciario |
|---|---|---|---|
| **1. Home** | Dos CTAs equivalentes: "Armá tu 11" + "Creá un draft" | Campo de ingreso de código de equipo | Link al feed + toggle idioma |
| **2. Armado modo solo** | Cancha con 11 puestos | Selector de jugadores (bottom sheet en mobile) | Contador presupuesto + 11/11 + controles config visibles + CTA Confirmar (gana peso al llegar a 11/11) |
| **3. Confirmación + card** | Card generada (vertical o cuadrada) | CTA Compartir (Web Share API) + CTA Descargar | Link a `/t/{codigo}` + CTA "Crear un draft" |
| **4. Página pública `/t/{codigo}`** | Render visual del equipo en formato vitrina | Metadatos (nombre, costo, modo, huecos X/11) | CTAs "Armá el tuyo" / "Creá un draft" + descarga de card |
| **5. Crear sala de draft** | Apodo + esenciales (cantidad, formación) | Avanzado plegable (posiciones, presupuesto, orden, tiempo, modo país) | CTA Crear sala |
| **6. Lobby de draft** | Lista de participantes conectados | Config de la sala visible + link/token compartible | CTA Iniciar (solo creador, si ≥2) + aviso de timeout |
| **7. Draft en vivo** | Tablero compartido (participantes × rondas) + countdown | Panel de turno activo: selector si es mi turno, "Turno de X" si no | Mi cancha + presupuesto restante + reveal de país (si modo país) |
| **8. Resultados post-draft** | Grilla/carrusel de los N equipos finales | Descarga de card individual + link `/t/{codigo}` por equipo | CTA card grupal opcional + huecos marcados |
| **9. Feed público** | Rankings (jugadores más elegidos, fuera de posición) | Feed scroll de equipos recientes | Stats de draft |
| **10. 404 código inválido** | Mensaje de error claro | Campo para reintentar código | CTA "Armá tu 11" |

## 5. Estados por pantalla

| Pantalla | Empty | Parcial | Completo | Error | Loading | Mobile/Offline |
|---|---|---|---|---|---|---|
| **1. Home** | Vista default con CTAs y campo código vacío | — | Campo con input válido (botón habilitado) | Aviso "código inválido" inline | Skeleton logo + CTAs | Mobile: stack vertical, código sobre el fold |
| **2. Armado modo solo** | Cancha con 11 puestos vacíos + defaults aplicados | X/11 puestos llenos + contador visible | 11/11 + presupuesto OK, CTA Confirmar activa | Jugador incompatible (posición/presupuesto) marcado y bloqueado, CTA con razón | Skeleton selector durante búsqueda (target <200ms) | Mobile: selector como bottom sheet sobre cancha; offline: aviso "sin conexión, búsqueda deshabilitada" |
| **3. Confirmación + card** | — *(no aplica: solo se accede tras confirmar)* | Card pre-generando: placeholder + spinner | Card lista, CTAs share/descargar activos | Falla de pre-generación (>3s): mensaje + reintento. Equipo existe igual | Pre-generando card (<3s target) | Mobile: share sheet nativo (Web Share API); fallback a descarga si no soportado |
| **4. Página pública `/t/{codigo}`** | — *(solo se resuelve con código existente)* | Equipo con huecos: marca visible "X/11" + motivo por hueco | Equipo 11/11 renderizado, CTAs descarga + "Armá el tuyo" | Código no existe → redirige a pantalla 10 | Skeleton del render de cancha | Mobile: stack vertical, card sobre el fold; offline: cache si disponible |
| **5. Crear sala** | Formulario con defaults + apodo vacío | Esenciales completos, avanzado plegado | Formulario válido, CTA Crear habilitado | Apodo inválido / cantidad fuera de rango: error inline | Creando sala (request) | Mobile: avanzado como accordion; desktop: columna lateral |
| **6. Lobby** | 1 participante (solo creador), estado "esperando" | 2-N participantes, CTA Iniciar activa para creador | Todos con formación asignada (si modo libre), listo | Sala llena al unirse / sala no existe / creador abandonó | Entrando a sala (resolución de token) | Mobile: lista vertical; aviso persistente de timeout restante |
| **7. Draft en vivo** | — *(solo se alcanza con sala en_curso y ≥2 participantes)* | Rondas en curso, X/11 por participante visible | Ronda 11 completada → transición a pantalla 8 | Desconexión: banner "reconectando…" sin salir de pantalla; pick inválido: error inline | Reveal de país animado (modo país); reveal de pick 2s | Mobile: tablero colapsa a "mi cancha" + picks de otros compactos; offline: banner persistente + reintento WS |
| **8. Resultados** | — *(solo tras completar 11 rondas)* | Cards pre-generando en paralelo: placeholders | N equipos con cards listas, links activos | Falla de generación de un equipo: card marcada con reintento | Pre-generando cards post-draft | Mobile: carrusel en vez de grilla; card grupal opcional como CTA aparte |
| **9. Feed público** | "Aún no hay suficientes equipos" (primeros días) | Rankings parciales, umbral "fuera de posición" no alcanzado | Todos los rankings + feed scrollable | Fallo de query: ranking cacheado + aviso | Skeleton de rankings + primeras 5 filas del feed | Mobile: secciones apiladas; offline: último cache disponible |
| **10. 404 código inválido** | — | — | Mensaje + campo reintento + CTA | — | Redirección breve desde `/t/{codigo}` inválido | Mobile: stack vertical, foco en input |

**Casos no-happy-path críticos a representar en wireframes:**

- **Abandono en armado:** vuelta al home sin confirmar = se pierde progreso (sin borrador, por diseño).
- **Abandono en lobby (creador):** sala pasa a `abandonada`, se expulsa al resto con aviso.
- **Timeout de lobby:** 30 min sin iniciar → sala muere.
- **Abandono total en draft:** 0 conectados >5 min → sala termina.
- **Desconexión durante turno:** banner "reconectando…" sin sacar al usuario de la pantalla. Si pierde un turno, segunda oportunidad si vuelve antes del siguiente turno.
- **Código inválido en home:** ingreso → pantalla 10 con reintento.

## 6. Componentes recurrentes

Anatomía mínima de los componentes que aparecen en múltiples pantallas. Una vez definidos, se reusan.

### Cancha
Visualización de 11 posiciones según formación activa (4-3-3 default; también 4-4-2, 3-5-2). Cada posición es un slot que puede estar:
- Vacío: label de puesto (ARQ, DEF, MED, DEL) y placeholder visual.
- Asignado: foto/avatar del jugador + nombre + costo (si modo presupuesto).
- Bloqueado en selector: jugador no elegible (sobre presupuesto, fuera de posición/país) — visible pero deshabilitado.
- Hueco post-draft: marca visual explícita "hueco" si quedó vacío en draft (para `/t/{codigo}` y resultados).

Tap en slot vacío abre Selector. Tap en slot asignado permite quitar/reemplazar (solo en armado en curso, nunca en `/t/{codigo}`).

### Selector de jugadores
Bottom sheet en mobile, panel lateral en desktop. Composición:
- Buscador arriba (tolerante a typos, match al inicio o en cualquier parte del nombre, target <200ms).
- Filtros pegados según contexto: posición (si `posiciones=fijas`), país (si `modo=pais_al_azar`), presupuesto restante.
- Lista scrolleable: avatar, nombre, selección, posición real, costo.
- Jugadores no elegibles: visibles pero bloqueados con razón.

### Card del equipo
Imagen vertical o cuadrada con: cancha + 11 jugadores (o huecos marcados) + apodo del autor (si lo cargó) + branding del producto + contexto cuando aplica ("Draft con 5 amigos, modo país"). Es el output viral. Se pre-genera <3s tras confirmación o post-draft.

### Tablero compartido (draft)
Grilla con N filas (una por participante). Cada fila: apodo, picks acumulados (slots 1 a 11), costo total si hay presupuesto. La fila del participante activo está resaltada. El countdown vive arriba, sincronizado con server (desviación <500ms target).

### Contador de presupuesto
Componente persistente cuando el modo lo requiere. Muestra: total, gastado, restante. Cambia visualmente al acercarse al límite. En el selector también filtra/bloquea jugadores que no entran.

### CTA de compartir
Botón primario que dispara `navigator.share` (Web Share API) con fallback a descarga de imagen. Aparece en confirmación del Modo Solo, en `/t/{codigo}`, y en resultados post-draft.

### Banner de reconexión (draft)
Banner persistente, no modal, que aparece cuando se pierde la conexión WS durante el draft. Mantiene al usuario en la pantalla 7 mientras intenta reconectar. No bloquea visualmente el tablero.

### Toggle de idioma
Footer o menú secundario. No protagonista. Cambia inmediato y persiste en localStorage.

### Tooltip inline
Pequeñas explicaciones contextuales para términos técnicos ("snake", "posiciones fijas", "país al azar"). Aparecen en pantalla 5 (Crear sala) principalmente. Reemplazan al onboarding inexistente.

## 7. Decisiones técnicas que afectan UX

- **Sin login, sin perfil, sin historial.** No diseñar pantallas de "mi cuenta" / "mis equipos".
- **URLs públicas con código.** `/t/{codigo}` es la única forma de "guardar". El código se muestra prominente para copiar/dictar.
- **Token de draft != código de equipo.** Link de invitación es `/draft/{token}` (impredecible), distinto del código de equipo final.
- **Realtime con desviación <500ms.** Countdown del draft es server-authoritative.
- **Web Share API + fallback obligatorio.** No asumir que está disponible.
- **Pre-generación de card con SLA de 3s.** Diseñar el estado loading explícitamente (no asumir instantáneo).
- **Búsqueda con SLA de 200ms.** Diseñar el estado "buscando" mínimo, casi imperceptible.
- **Sin borrador en armado solo.** Si el usuario sale, pierde todo. Esto debería transmitirse visualmente (no sugerir "guardado automático").
- **Inmutabilidad de equipos confirmados.** El diseño de `/t/{codigo}` no debe sugerir editabilidad.

## 8. Contenido de muestra

Para que los wireframes no usen lorem ipsum y se sienta el dominio.

**Jugadores de muestra:**
- Lionel Messi (ARG) — DEL — $15M
- Kylian Mbappé (FRA) — DEL — $14M
- Erling Haaland (NOR) — DEL — $13M
- Vinicius Jr (BRA) — DEL — $12M
- Jude Bellingham (ENG) — MED — $11M
- Rodri (ESP) — MED — $10M
- Pedri (ESP) — MED — $9M
- Virgil van Dijk (NED) — DEF — $9M
- Achraf Hakimi (MAR) — DEF — $8M
- Thibaut Courtois (BEL) — ARQ — $7M

**Formaciones soportadas:** 4-3-3 (default), 4-4-2, 3-5-2

**Modos de selección de draft:** libre, posiciones fijas, país al azar

**Presupuestos típicos:** $80M, $100M (default), $120M

**Apodos de muestra:** "Juani", "Tincho", "MartuM10", "elPablito"

**Códigos de equipo:** ABC123, XYZ789, K7M2P9

**Tokens de draft (solo formato):** `dft_8sk2j9` (impredecible, no derivable del código)

## 9. Referencias visuales / estilo

- **Inspiración estructural del draft:** Sleeper (tablero compartido participantes × rondas) y Jackbox (ritual social, animaciones). El product map cita ambas explícitamente.
- **Inspiración de layout de equipo:** apps deportivas modernas tipo FotMob u Onefootball para visualizar canchas.
- **Inspiración de "compartibilidad viral":** Wordle/Quordle — la card es el output diseñado para screenshot y share.
- **Densidad:** baja a media. Mucho aire en mobile. Excepción: pantalla 7 (Draft en vivo) tiene densidad alta declarada como riesgo conocido — diseñar con jerarquía clara para mitigar.
- **Tono:** festivo pero limpio. No es fantasy serio, es algo que se manda al grupo para divertirse.
- **Para wireframes low-fi específicamente:** cajas grises, sin colores de marca, sans-serif neutral, placeholders explícitos (`[Foto jugador]`, `[Avatar]`, `[Logo selección]`, `[Card generada 9:16]`). No representar fotos ni colores.

## 10. Decisiones aún abiertas (NO presuponer en wireframes)

> Estas preguntas están sin resolver en el equipo. Si Claude Design tiene que tomar partido, **debe hacerlo explícito** y mostrarse abierto a iterar. Idealmente, generar variantes para las que sean ambiguas.

1. **Peso del draft en el home:** ¿dos CTAs equivalentes (propuesta actual) o el draft escondido detrás de "ya tengo código"?
2. **Configuración del modo solo:** ¿embebida en armado (propuesta actual) o pantalla previa de configuración?
3. **Layout del draft en vivo:** ¿tablero compartido protagonista (propuesta actual, denso en mobile) o "mi cancha" prioritaria con picks de otros en panel lateral?
4. **Pre-generación de card:** ¿bloqueante en confirmación con loading hasta 3s (propuesta actual) o asincrónica con confirmación instantánea?
5. **Reveal de país:** ¿modal interruptiva 2-3s para todos o animación in-place dentro del tablero?
6. **Feed público:** ¿solo sección de descubrimiento desde home (propuesta actual) o destino compartido con URLs propias por ranking?

## 11. Cómo usar este documento con Claude Design

1. Adjuntá los 4 archivos: `product-map.md`, `sitemap.md`, `user-stories.md`, `design-context.md`.
2. En el prompt, especificá el feature group que querés diseñar: "Quiero wireframes low-fi del flow FG3 — Modo Solo end-to-end, mobile-first".
3. Pedile que diseñe **por flow**, no pantalla suelta. Un flow es: entry, pasos, decisiones, exit.
4. Si el flow tiene >6 pantallas, dividirlo en sub-flows (onboarding, armado, confirmación, share).
5. Para decisiones abiertas (§10), pedile **2 variantes** y dejá que el equipo decida.
6. Después del primer output: comments inline para tweaks puntuales, chat para cambios estructurales.
7. Cuando algo cambie en este `design-context.md`, regenerar wireframes afectados — no editar a mano sobre versiones viejas.
