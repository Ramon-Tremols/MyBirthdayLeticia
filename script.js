// ===== CONFIGURACIÓN INICIAL =====
const config = {
  introDelay: 15000,
  audioFadeDelay: 500,
  observerThreshold: 0.2
};

// Ajuste de --vh para barras móviles (iOS/Android) y evitar problemas con 100vh
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
// Ejecutar y actualizar en resize/orientation
setVh();
window.addEventListener('resize', setVh);
window.addEventListener('orientationchange', setVh);

// ===== ELEMENTOS DEL DOM =====
const elements = {
  card: document.querySelector('.card'),
  audio: document.getElementById('bg-audio'),
  overlay: document.getElementById('audio-overlay'),
  intro: document.getElementById('intro'),
  sections: document.querySelectorAll('.section'),
  details: document.querySelector('.details')
};

// ===== ANIMACIÓN 3D DE LA TARJETA (Desktop) =====
function initCardAnimation() {
  if (!elements.card) return;
  
  // Solo activar en dispositivos no táctiles
  elements.card.addEventListener('mousemove', handleCardMouseMove);
  elements.card.addEventListener('mouseleave', handleCardMouseLeave);
  if (window.matchMedia('(hover: hover)').matches) {
  }
}

function handleCardMouseMove(e) {
  const rect = elements.card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const rotateX = ((y - centerY) / centerY) * 8;
  const rotateY = ((x - centerX) / centerX) * -8;

  elements.card.style.transform = `
    perspective(1000px)
    rotateX(${rotateX}deg)
    rotateY(${rotateY}deg)
    scale3d(1.02, 1.02, 1.02)
  `;
  elements.card.style.transition = 'none';
}

function handleCardMouseLeave() {
  elements.card.style.transform = '';
  elements.card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
}

// ===== GESTIÓN DE AUDIO =====
function initAudio() {
  if (!elements.audio || !elements.overlay) return;

  // Configurar audio
  elements.audio.volume = 0.5; // Volumen moderado
  elements.audio.loop = true;

  // Intentar reproducción automática al cargar
  window.addEventListener('load', attemptAutoplay);

  // Reproducir al hacer clic en el overlay
  elements.overlay.addEventListener('click', playAudioFromOverlay);
  
  // Soporte para teclado (accesibilidad)
  elements.overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      playAudioFromOverlay();
    }
  });
}

function attemptAutoplay() {
  if (!elements.audio) return;

  elements.audio.play()
    .then(() => {
      // Autoplay exitoso
      hideOverlay();
      // Activar animaciones si la reproducción se inicia automáticamente
      document.documentElement.classList.add('entered');
      initScrollAnimations();
    })
    .catch(() => {
      // Autoplay bloqueado (es normal en la mayoría de navegadores)
      showOverlay();
    });
}

function playAudioFromOverlay() {
  if (!elements.audio || !elements.overlay) return;

  elements.audio.play()
    .then(() => {
      hideOverlay();
      // Activar animaciones y observers sólo después de que el usuario acepte audio
      document.documentElement.classList.add('entered');
      initScrollAnimations();
    })
    .catch(error => {
      console.error('Error al reproducir audio:', error);
      // Mostrar mensaje de error al usuario
      const span = elements.overlay.querySelector('span');
      if (span) {
        span.textContent = '❌ Error al reproducir música';
        setTimeout(() => {
          span.textContent = '🎵 Toca para intentar de nuevo';
        }, 2000);
      }
    });
} 

function hideOverlay() {
  if (!elements.overlay) return;

  // Añadir clase que activa la transición de cierre
  elements.overlay.classList.add('closing');

  // Esperar al transitionend para ocultar/limpiar el DOM (más fiable que timeouts)
  const onTransitionEnd = (e) => {
    if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
      // marcar como oculto para accesibilidad y remover del flujo
      elements.overlay.setAttribute('aria-hidden', 'true');
      elements.overlay.style.display = 'none';
      elements.overlay.removeEventListener('transitionend', onTransitionEnd);
  elements.overlay.style.zIndex = '-100';
      // Asegurar que el audio siga reproduciéndose (por si el navegador lo detuvo por enfoque)
      if (elements.audio) {
        elements.audio.play().catch(() => {
          /* no bloquear si el navegador evita autoplay */
        });
      }
    }
  };

  elements.overlay.addEventListener('transitionend', onTransitionEnd);

  // Fallback por si no se dispara transitionend (ej. navegadores antiguos)
  setTimeout(() => {
    if (elements.overlay && elements.overlay.style.display !== 'none') {
      elements.overlay.setAttribute('aria-hidden', 'true');
      elements.overlay.style.display = 'none';
      elements.overlay.removeEventListener('transitionend', onTransitionEnd);

      if (elements.audio) {
        elements.audio.play().catch(() => {});
      }
    }
  }, 800);
}

function showOverlay() {
  if (!elements.overlay) return;
  
  elements.overlay.style.display = 'flex';
  elements.overlay.style.opacity = '1';
}

// ===== PANTALLA DE INTRO =====
function initIntro() {
  if (!elements.intro) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      elements.intro.style.opacity = '0';
      setTimeout(() => {
        elements.intro.remove();
      }, 1200);
    }, config.introDelay);
  });
}

// ===== INTERSECTION OBSERVER PARA ANIMACIONES =====
function initScrollAnimations() {
  // Observer para secciones generales
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Desconectar después de animar (mejora de rendimiento)
          sectionObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: config.observerThreshold,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  // Observar todas las secciones
  elements.sections.forEach(section => {
    sectionObserver.observe(section);
  });

  // Observer específico para la sección de detalles
  if (elements.details) {
    const detailsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            elements.details.classList.add('visible');
            detailsObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    );

    detailsObserver.observe(elements.details);
  }
}

// ===== SMOOTH SCROLL PARA ENLACES =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ===== PRELOAD DE IMÁGENES =====
function preloadImages() {
  const images = [
    'assets/flor-izq.png',
    'assets/flor-der.png',
    'assets/imagenes/fondo.png'
  ];

  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// ===== MANEJO DE ERRORES DE RECURSOS =====
function initErrorHandling() {
  // Manejar errores de audio
  if (elements.audio) {
    elements.audio.addEventListener('error', (e) => {
      console.error('Error al cargar el audio:', e);
      if (elements.overlay) {
        const span = elements.overlay.querySelector('span');
        if (span) {
          span.textContent = '⚠️ Audio no disponible';
        }
      }
    });
  }

  // Manejar errores de imágenes
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      console.error('Error al cargar imagen:', this.src);
      this.style.opacity = '0';
    });
  });
}

// ===== OPTIMIZACIÓN DE RENDIMIENTO =====
function optimizePerformance() {
  // Reducir animaciones si el usuario lo prefiere
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reduced-motion');
  }

  // Pausar audio cuando la pestaña no está visible
  document.addEventListener('visibilitychange', () => {
    if (elements.audio) {
      if (document.hidden) {
        elements.audio.pause();
      } else {
        elements.audio.play().catch(() => {
          // Silenciosamente manejar el error
        });
      }
    }
  });
}

// ===== ANALYTICS (Opcional) =====
function trackEvents() {
  // Rastrear reproducción de audio
  if (elements.audio) {
    elements.audio.addEventListener('play', () => {
      console.log('Audio reproducido');
      // Aquí puedes agregar Google Analytics u otro servicio
      // gtag('event', 'audio_play', { event_category: 'engagement' });
    });
  }

  // Rastrear clics en enlaces importantes
  document.querySelectorAll('.item a').forEach(link => {
    link.addEventListener('click', (e) => {
      console.log('Click en enlace:', e.target.textContent);
      // gtag('event', 'link_click', { event_category: 'engagement', link_text: e.target.textContent });
    });
  });
}

// ===== INICIALIZACIÓN =====
function init() {
  // Precargar recursos
  preloadImages();
  
  // Inicializar componentes
  initCardAnimation();
  initAudio();
  initIntro();
  // initScrollAnimations() se invoca después de iniciar el audio para que las animaciones comiencen al entrar
  initSmoothScroll();
  initErrorHandling();
  optimizePerformance();
  trackEvents();

  // Log de inicialización exitosa
  console.log('✨ Invitación inicializada correctamente');
} 

// ===== EJECUTAR AL CARGAR EL DOM =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ===== EXPORTAR FUNCIONES PARA USO EXTERNO (Opcional) =====
window.InvitationApp = {
  playAudio: () => elements.audio?.play(),
  pauseAudio: () => elements.audio?.pause(),
  resetAnimations: () => {
    elements.sections.forEach(section => section.classList.remove('visible'));
    initScrollAnimations();
  }
};