# 📝 Mis Tareas Pendientes - PWA

Una aplicación web progresiva (PWA) moderna y elegante para gestionar tus tareas pendientes. Diseñada con una interfaz intuitiva y funcionalidades avanzadas para ayudarte a mantener tu productividad organizada.

## ✨ Características

### 🎯 Gestión de Tareas
- **Agregar tareas** con título, fecha, hora y prioridad
- **Sistema de prioridades** visual con colores (Baja 🟢, Media 🟡, Alta 🟠, Urgente 🔴)
- **Tareas recurrentes** con configuración flexible:
  - Diarias
  - Mensuales (días específicos del mes)
  - Días específicos de la semana
- **Tareas sin fecha** para ideas y recordatorios generales

### 📱 Características PWA
- **Instalable** como aplicación nativa
- **Funciona offline** con service worker
- **Responsive** - se adapta a móviles, tablets y escritorio
- **Notificaciones** y recordatorios (si el navegador lo permite)

### 🗓️ Calendario Integrado
- **Vista de calendario** mensual
- **Navegación** entre meses
- **Visualización de tareas** por fecha seleccionada
- **Indicadores visuales** de días con tareas

### 🔧 Funcionalidades Avanzadas
- **Filtros múltiples**: Todas, Pendientes, Completadas, Recurrentes, Sin fecha, Por prioridad
- **Estadísticas** en tiempo real
- **Exportar/Importar** tareas en formato JSON
- **Interfaz colapsible** para mejor organización
- **Almacenamiento local** persistente

## 🚀 Instalación y Uso

### Opción 1: Usar directamente
1. Descarga o clona este repositorio
2. Abre `index.html` en tu navegador
3. ¡Comienza a agregar tus tareas!

### Opción 2: Servidor local (recomendado para PWA)
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (usando npx)
npx serve .

# Con PHP
php -S localhost:8000
```

Visita `http://localhost:8000` en tu navegador.

### Opción 3: Instalación como PWA
1. Abre la aplicación en un navegador compatible (Chrome, Firefox, Safari, Edge)
2. Busca el botón "📱 Instalar App" o el ícono de instalación en la barra de direcciones
3. Sigue las instrucciones para instalar en tu dispositivo

## 📱 Compatibilidad

- ✅ Chrome/Chromium (escritorio y móvil)
- ✅ Firefox (escritorio y móvil)
- ✅ Safari (escritorio y móvil)
- ✅ Edge (escritorio y móvil)
- ✅ Opera (escritorio y móvil)

## 🛠️ Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Diseño moderno con variables CSS y flexbox/grid
- **JavaScript ES6+** - Lógica de aplicación
- **Service Worker** - Funcionalidad offline y cache
- **Web App Manifest** - Configuración PWA
- **LocalStorage** - Persistencia de datos
- **Font Awesome** - Iconografía
- **Google Fonts (Inter)** - Tipografía moderna

## 📂 Estructura del Proyecto

```
├── index.html          # Página principal
├── styles.css          # Estilos de la aplicación
├── script.js           # Lógica principal de JavaScript
├── sw.js              # Service Worker para PWA
├── manifest.json      # Manifiesto de la aplicación web
├── icons/             # Iconos de la PWA (varios tamaños)
├── generate-icons.html # Generador de iconos (opcional)
└── README.md          # Documentación
```

## 🎨 Personalización

### Colores del tema
Los colores principales se pueden modificar en `styles.css` cambiando las variables CSS:

```css
:root {
    --primary-bg: #0a0a0a;
    --secondary-bg: #1a1a1a;
    --accent-color: #333;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
}
```

### Iconos personalizados
Puedes reemplazar los iconos en la carpeta `icons/` con tus propios iconos manteniendo los mismos nombres y tamaños.

## 🔄 Backup y Restauración

La aplicación incluye funcionalidad completa de backup:

1. **Exportar**: Descarga todas tus tareas en formato JSON
2. **Importar**: Restaura tus tareas desde un archivo de backup
3. **Automático**: Los datos se guardan automáticamente en localStorage

## 🐛 Resolución de Problemas

### La PWA no se instala
- Asegúrate de servir la aplicación desde HTTPS o localhost
- Verifica que todos los archivos del manifiesto estén presentes
- Revisa la consola del navegador para errores

### Las tareas no se guardan
- Verifica que localStorage esté habilitado en tu navegador
- Revisa si hay restricciones de almacenamiento
- Intenta limpiar el cache del navegador

### Problemas de rendimiento
- La aplicación está optimizada para miles de tareas
- Si experimentas lentitud, considera exportar y limpiar tareas antiguas

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la aplicación:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor abre un [issue](../../issues) en este repositorio.

---

**¡Mantente productivo y organizado con Mis Tareas Pendientes!** 🎯✨ 