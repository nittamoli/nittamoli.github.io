// Función para navegar entre las distintas pantallas de la interfaz
function navegar(idPantalla) {
    // Ocultar todas las pantallas
    const pantallas = document.querySelectorAll('.screen');
    pantallas.forEach(pantalla => {
        pantalla.classList.remove('active');
    });

    // Mostrar la pantalla solicitada
    const pantallaDestino = document.getElementById(idPantalla);
    if (pantallaDestino) {
        pantallaDestino.classList.add('active');
    }
}

const canciones = [
    { titulo: 'Revolución Estéreo (feat. JOTA CRUZ)', archivo: 'Revolución Estéreo (feat. JOTA CRUZ) (128kbit_AAC).m4a' },
    { titulo: 'Presión (feat. Hopeless & Tango Torino)', archivo: 'Presión (feat. Hopeless & Tango Torino) (128kbit_AAC).m4a' },
    { titulo: 'Contártelo (feat. Simoncito & Tango Torino)', archivo: 'Contártelo (feat. Simoncito & Tango Torino) (128kbit_AAC).m4a' },
    { titulo: 'Aeroparque (feat. Agukki)', archivo: 'Aeroparque (feat. Agukki) (128kbit_AAC).m4a' },
    { titulo: 'Solo x vos (feat. Candebx)', archivo: 'Solo x vos (feat. Candebx) (128kbit_AAC).m4a' },
    { titulo: 'Fuera de Ritmo (feat. Vianant)', archivo: 'Fuera de Ritmo (feat. Vianant) (128kbit_AAC).m4a' },
    { titulo: 'Jennifer Track (feat. Hayami2k)', archivo: 'Jennifer Track (feat. Hayami2k) (128kbit_AAC).m4a' },
    { titulo: 'El Interludio de Jochu (feat. Jochu)', archivo: 'El Interludio de Jochu (feat. Jochu) (128kbit_AAC).m4a' },
    { titulo: 'Ícaro (Música para películas)', archivo: 'Ícaro (Música para películas) (128kbit_AAC).m4a' },
    { titulo: 'Movimiento (feat. Alan Muñoz)', archivo: 'Movimiento (feat. Alan Muñoz) (160kbit_Opus).opus' },
    { titulo: 'Torcuato Express (feat. nacho9k & gouzes)', archivo: 'Torcuato Express (feat. nacho9k & gouzes) (152kbit_Opus).opus' },
    { titulo: 'Mensajes (feat. JOTA CRUZ)', archivo: 'Mensajes (feat. JOTA CRUZ) (128kbit_AAC).m4a' },
    { titulo: 'Ultravioleta (feat. Agukki)', archivo: 'Ultravioleta (feat. Agukki) (128kbit_AAC).m4a' },
    { titulo: 'Nuevo Sol (feat. fantasíafueguina)', archivo: 'Nuevo Sol (feat. fantasíafueguina) (128kbit_AAC).m4a' }
];

let cancionActual = -1;
let errorReproduccionReportado = false;
let contextoAudio;
let analizadorAudio;
let gananciaMusica;
let fuenteAudio;
let datosFrecuencia;
let volumenMusicaActual = 1;

function configurarVisualizador() {
    const canvas = document.getElementById('audio-visualizer');
    const contexto = canvas.getContext('2d');
    const audio = document.getElementById('audio-player');
    const paletaPredeterminada = ['#08d9ff', '#284bff', '#8d24ff', '#ed28d5', '#ffc2f0'];
    const paletasPorTramo = [
        {
            inicio: 0,
            fin: 2,
            colores: ['#08d9ff', '#58dfff', '#ff59c4', '#ffc2f0'],
            fondo: ['rgba(8, 217, 255, 0.18)', 'rgba(255, 89, 196, 0.16)']
        },
        {
            inicio: 3,
            fin: 7,
            colores: ['#ff00ff', '#9b39ff', '#08d9ff'],
            fondo: ['rgba(255, 79, 184, 0.18)', 'rgba(8, 217, 255, 0.16)']
        },
        {
            inicio: 8,
            fin: 11,
            colores: ['#ff00ff', '#08d9ff', '#8d24ff', '#ff806b'],
            fondo: ['rgba(255, 79, 184, 0.18)', 'rgba(8, 217, 255, 0.16)']
        },
        {
            inicio: 12,
            fin: 13,
            colores: ['#ff00ff', '#ff806b', '#8d24ff', '#ff9d38'],
            fondo: ['rgba(255, 79, 184, 0.18)', 'rgba(255, 128, 107, 0.16)']
        }
    ];
    const particulas = Array.from({ length: 120 }, () => ({
        x: 0,
        y: 0,
        velocidad: 0.25 + Math.random() * 0.75,
        frecuencia: 0.03 + Math.random() * 0.72,
        fase: Math.random() * Math.PI * 2
    }));
    let ancho = 0;
    let alto = 0;
    let escala = 1;
    let animacion;
    let ultimoDibujo = 0;
    let tramoFondoAplicado = null;
    const intervaloFotograma = 1000 / 30;

    function obtenerTramoActual() {
        return paletasPorTramo.find(tramo =>
            cancionActual >= tramo.inicio && cancionActual <= tramo.fin
        );
    }

    function aplicarFondoDelTramo(tramo) {
        if (tramo && tramo !== tramoFondoAplicado) {
            canvas.style.setProperty('--color-audio-uno', tramo.fondo[0]);
            canvas.style.setProperty('--color-audio-dos', tramo.fondo[1]);
            tramoFondoAplicado = tramo;
        }
    }

    function ajustarCanvas() {
        const anchoAnterior = ancho;
        const altoAnterior = alto;
        escala = Math.min(window.devicePixelRatio || 1, 1.25);
        ancho = window.innerWidth;
        alto = window.innerHeight;
        canvas.width = Math.round(ancho * escala);
        canvas.height = Math.round(alto * escala);
        contexto.setTransform(escala, 0, 0, escala, 0, 0);

        particulas.forEach(particula => {
            particula.x = anchoAnterior ? particula.x * ancho / anchoAnterior : Math.random() * ancho;
            particula.y = altoAnterior ? particula.y * alto / altoAnterior : Math.random() * alto;
        });
    }

    function dibujar(tiempo) {
        if (audio.paused || audio.ended) {
            contexto.clearRect(0, 0, ancho, alto);
            animacion = undefined;
            return;
        }

        if (tiempo - ultimoDibujo < intervaloFotograma) {
            animacion = requestAnimationFrame(dibujar);
            return;
        }
        ultimoDibujo = tiempo;

        const analizarFrecuencias = analizadorAudio && datosFrecuencia;
        if (analizarFrecuencias) {
            analizadorAudio.getByteFrequencyData(datosFrecuencia);
        }
        contexto.clearRect(0, 0, ancho, alto);
        contexto.globalCompositeOperation = 'screen';
        const tramoActual = obtenerTramoActual();
        const paleta = tramoActual ? tramoActual.colores : paletaPredeterminada;
        aplicarFondoDelTramo(tramoActual);

        particulas.forEach(particula => {
            const indiceFrecuencia = analizarFrecuencias
                ? Math.floor(particula.frecuencia * datosFrecuencia.length)
                : 0;
            const intensidad = analizarFrecuencias
                ? datosFrecuencia[indiceFrecuencia] / 255
                : 0.12 + (Math.sin(audio.currentTime * (2 + particula.frecuencia * 6) + particula.fase) + 1) * 0.24;
            if (intensidad < 0.025) {
                return;
            }

            particula.x += Math.sin(tiempo * 0.0005 + particula.fase) * (0.15 + intensidad * 0.6);
            particula.y -= particula.velocidad + intensidad * 2.8;
            if (particula.y < -8) {
                particula.y = alto + Math.random() * 30;
                particula.x = Math.random() * ancho;
            }

            const indiceColor = Math.max(0, Math.min(
                paleta.length - 1,
                Math.floor(particula.x / ancho * paleta.length)
            ));
            const color = paleta[indiceColor];
            contexto.beginPath();
            contexto.fillStyle = color;
            contexto.globalAlpha = 0.12 + intensidad * 0.78;
            contexto.arc(particula.x, particula.y, 1 + intensidad * 4, 0, Math.PI * 2);
            contexto.fill();
        });

        contexto.globalAlpha = 1;
        contexto.globalCompositeOperation = 'source-over';

        animacion = requestAnimationFrame(dibujar);
    }

    window.addEventListener('resize', ajustarCanvas);
    audio.addEventListener('play', () => {
        aplicarFondoDelTramo(obtenerTramoActual());
        canvas.classList.add('is-playing');
        if (animacion === undefined) {
            animacion = requestAnimationFrame(dibujar);
        }
    });
    function detenerVisualizador() {
        canvas.classList.remove('is-playing');
        if (animacion !== undefined) {
            cancelAnimationFrame(animacion);
            animacion = undefined;
        }
        ultimoDibujo = 0;
        contexto.clearRect(0, 0, ancho, alto);
    }
    audio.addEventListener('pause', detenerVisualizador);
    audio.addEventListener('ended', detenerVisualizador);
    ajustarCanvas();
}

function prepararAnalisisAudio(audio) {
    if (window.location.protocol === 'file:') {
        console.warn('El análisis de frecuencias requiere servir la página por HTTP; se usará una animación de respaldo.');
        return Promise.resolve();
    }

    if (!window.AudioContext && !window.webkitAudioContext) {
        console.error('Este navegador no permite analizar el audio para el visualizador.');
        return Promise.resolve();
    }

    if (!contextoAudio) {
        const ContextoAudio = window.AudioContext || window.webkitAudioContext;
        contextoAudio = new ContextoAudio();
        analizadorAudio = contextoAudio.createAnalyser();
        analizadorAudio.fftSize = 512;
        analizadorAudio.smoothingTimeConstant = 0.88;
        gananciaMusica = contextoAudio.createGain();
        fuenteAudio = contextoAudio.createMediaElementSource(audio);
        fuenteAudio.connect(gananciaMusica);
        gananciaMusica.connect(analizadorAudio);
        analizadorAudio.connect(contextoAudio.destination);
        datosFrecuencia = new Uint8Array(analizadorAudio.frequencyBinCount);
        gananciaMusica.gain.value = volumenMusicaActual;
        audio.volume = 1;
    }

    return contextoAudio.state === 'suspended'
        ? contextoAudio.resume()
        : Promise.resolve();
}

function reproducirAudioPreparado(audio) {
    let activacionAudio;
    try {
        activacionAudio = prepararAnalisisAudio(audio);
    } catch (error) {
        console.error('No se pudo iniciar el análisis de audio.', error);
    }

    audio.play().catch(error => reportarErrorReproduccion(error));
    activacionAudio?.catch(error => console.error('No se pudo reactivar el análisis de audio.', error));
}

function cargarCanciones() {
    const tracklist = document.getElementById('tracklist');

    canciones.forEach((cancion, indice) => {
        const li = document.createElement('li');
        li.className = 'track-item';
        li.dataset.indice = indice;

        const nombre = document.createElement('span');
        nombre.className = 'track-name';
        nombre.textContent = cancion.titulo;

        const controles = document.createElement('div');
        controles.className = 'track-controls';
        controles.innerHTML = `
            <button class="play-btn" type="button" aria-label="Reproducir ${cancion.titulo}">▶</button>
        `;

        controles.querySelector('.play-btn').addEventListener('click', () => reproducirCancion(indice));

        li.append(
            nombre,
            controles
        );
        tracklist.appendChild(li);
    });
}

function actualizarInterfazReproductor() {
    const audio = document.getElementById('audio-player');
    const botonPlayPause = document.getElementById('play-pause');
    const filas = document.querySelectorAll('.track-item');
    const avisoSpace = document.getElementById('aviso-space');
    const estaReproduciendo = cancionActual >= 0 && !audio.paused;

    filas.forEach((fila, indice) => {
        const activa = indice === cancionActual;
        fila.classList.toggle('active', activa);
        const boton = fila.querySelector('.play-btn');
        const enReproduccion = activa && !audio.paused;
        boton.textContent = enReproduccion ? '❚❚' : '▶';
        boton.setAttribute('aria-label', `${enReproduccion ? 'Pausar' : 'Reproducir'} ${canciones[indice].titulo}`);
    });

    document.getElementById('disco-girando').classList.toggle('playing', estaReproduciendo);
    botonPlayPause.textContent = estaReproduciendo ? '❚❚' : '▶';
    botonPlayPause.setAttribute('aria-label', estaReproduciendo ? 'Pausar' : 'Reproducir');
    avisoSpace.classList.toggle('playing', estaReproduciendo);
    avisoSpace.classList.toggle('paused', !estaReproduciendo);

    avisoSpace.textContent = estaReproduciendo ? canciones[cancionActual].titulo : 'Presiona Space';
}

function reportarErrorReproduccion(error) {
    if (errorReproduccionReportado || cancionActual < 0) {
        return;
    }

    errorReproduccionReportado = true;
    console.error(`No se pudo reproducir ${canciones[cancionActual].titulo}.`, error);
}

function reproducirCancion(indice) {
    const audio = document.getElementById('audio-player');

    if (indice === cancionActual && !audio.paused) {
        audio.pause();
        return;
    }

    if (indice === cancionActual && audio.currentSrc) {
        errorReproduccionReportado = false;
        reproducirAudioPreparado(audio);
        return;
    }

    cancionActual = indice;
    errorReproduccionReportado = false;
    audio.src = `../pistas-album/${encodeURIComponent(canciones[indice].archivo)}`;
    actualizarInterfazReproductor();
    reproducirAudioPreparado(audio);
}

function cambiarCancion(direccion) {
    const siguienteIndice = (cancionActual + direccion + canciones.length) % canciones.length;
    reproducirCancion(siguienteIndice);
}

function configurarReproductor() {
    const audio = document.getElementById('audio-player');
    const alternarReproduccion = () => {
        if (audio.paused) {
            reproducirCancion(cancionActual < 0 ? 0 : cancionActual);
        } else {
            audio.pause();
        }
    };

    document.getElementById('play-pause').addEventListener('click', alternarReproduccion);
    document.getElementById('anterior').addEventListener('click', () => cambiarCancion(-1));
    document.getElementById('siguiente').addEventListener('click', () => cambiarCancion(1));
    document.addEventListener('keydown', event => {
        if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const pantallaReproductor = document.getElementById('pantalla-reproductor');
        if (!pantallaReproductor.classList.contains('active')) {
            return;
        }

        event.preventDefault();
        alternarReproduccion();
    });
    audio.addEventListener('play', actualizarInterfazReproductor);
    audio.addEventListener('pause', actualizarInterfazReproductor);
    audio.addEventListener('ended', () => cambiarCancion(1));
    audio.addEventListener('error', () => {
        if (cancionActual >= 0 && !errorReproduccionReportado) {
            reportarErrorReproduccion(audio.error || new Error('Error al cargar el archivo de audio.'));
        }
    });
}

function configurarBarraSonido() {
    const audio = document.getElementById('audio-player');
    const sonidosEfectos = {
        general: new Audio('../efectos/pop1.mp3'),
        navegacion: new Audio('../efectos/pop2.mp3'),
        redes: new Audio('../efectos/pop3.mp3'),
        papel: new Audio('../efectos/flip-papel.mp3')
    };
    const overlay = document.getElementById('sound-overlay');
    const abrir = document.getElementById('sound-menu-toggle');
    const cerrar = document.getElementById('sound-panel-close');
    const panel = document.getElementById('sound-panel');
    const volumenMaster = document.getElementById('volume-master');
    const volumenMusica = document.getElementById('volume-music');
    const volumenEfectos = document.getElementById('volume-effects');
    const sliders = [volumenMaster, volumenMusica, volumenEfectos];
    let elementoAnterior;

    function actualizarSalida(slider) {
        slider.nextElementSibling.value = `${slider.value}%`;
    }

    function actualizarVolumenMusica() {
        volumenMusicaActual = (Number(volumenMaster.value) / 100) * (Number(volumenMusica.value) / 100);
        if (gananciaMusica) {
            gananciaMusica.gain.value = volumenMusicaActual;
            audio.volume = 1;
        } else {
            audio.volume = volumenMusicaActual;
        }
    }

    function actualizarVolumenEfectos() {
        const volumen = (Number(volumenMaster.value) / 100) * (Number(volumenEfectos.value) / 100);
        Object.values(sonidosEfectos).forEach(efecto => {
            efecto.volume = volumen;
        });
    }

    function reproducirEfecto(tipo) {
        const efecto = sonidosEfectos[tipo];
        efecto.currentTime = 0;
        efecto.play().catch(error => {
            console.error(`No se pudo reproducir el efecto de sonido ${tipo}.`, error);
        });
    }

    document.querySelectorAll('.social-links a').forEach(enlace => {
        enlace.addEventListener('click', () => reproducirEfecto('redes'));
    });

    document.addEventListener('click', event => {
        const objetivo = event.target instanceof Element
            ? event.target.closest('button, .clickable')
            : null;
        if (!objetivo || objetivo.matches(':disabled')) {
            return;
        }

        const esAccionNavegacion = objetivo.matches('.back-to-case, #anterior, #booklet-anterior');
        const esPausa = !audio.paused && (
            objetivo.matches('#play-pause')
            || objetivo.matches('.play-btn[aria-label^="Pausar"]')
        );
        reproducirEfecto(esAccionNavegacion || esPausa ? 'navegacion' : 'general');
    }, true);

    function abrirPanel() {
        elementoAnterior = document.activeElement;
        overlay.hidden = false;
        abrir.setAttribute('aria-expanded', 'true');
        cerrar.focus();
    }

    function cerrarPanel() {
        overlay.hidden = true;
        abrir.setAttribute('aria-expanded', 'false');
        elementoAnterior?.focus();
    }

    abrir.addEventListener('click', abrirPanel);
    cerrar.addEventListener('click', cerrarPanel);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            cerrarPanel();
        }
    });
    document.addEventListener('keydown', event => {
        if (overlay.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            cerrarPanel();
            return;
        }

        if (event.key === 'Tab') {
            const elementosEnfocables = Array.from(panel.querySelectorAll('button, input'))
                .filter(elemento => !elemento.disabled);
            const primerElemento = elementosEnfocables[0];
            const ultimoElemento = elementosEnfocables[elementosEnfocables.length - 1];
            if (event.shiftKey && document.activeElement === primerElemento) {
                event.preventDefault();
                ultimoElemento.focus();
            } else if (!event.shiftKey && document.activeElement === ultimoElemento) {
                event.preventDefault();
                primerElemento.focus();
            }
        }
    });

    sliders.forEach(slider => {
        slider.style.setProperty('--volume-level', `${slider.value}%`);
        slider.addEventListener('input', () => {
            slider.style.setProperty('--volume-level', `${slider.value}%`);
            actualizarSalida(slider);
            if (slider === volumenMaster || slider === volumenMusica) {
                actualizarVolumenMusica();
            }
            if (slider === volumenMaster || slider === volumenEfectos) {
                actualizarVolumenEfectos();
            }
        });
        actualizarSalida(slider);
    });
    actualizarVolumenMusica();
    actualizarVolumenEfectos();

    return reproducirEfecto;
}

function configurarVideoFondo() {
    const video = document.getElementById('video-background');

    function reproducirVideo() {
        if (video.paused) {
            video.play().catch(error => {
                if (error.name !== 'AbortError') {
                    console.warn('No se pudo iniciar el video de fondo; se mantiene la imagen de respaldo.', error);
                }
            });
        }
    }

    reproducirVideo();
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            reproducirVideo();
        }
    });
}

function configurarPerfil() {
    const overlay = document.getElementById('profile-overlay');
    const panel = document.getElementById('profile-panel');
    const abrir = document.getElementById('artist-nav-link');
    const cerrar = document.getElementById('profile-panel-close');

    function cerrarPerfil() {
        overlay.hidden = true;
        abrir.setAttribute('aria-expanded', 'false');
        abrir.focus();
    }

    abrir.addEventListener('click', () => {
        if (!overlay.hidden) {
            cerrarPerfil();
            return;
        }

        overlay.hidden = false;
        abrir.setAttribute('aria-expanded', 'true');
        cerrar.focus();
    });

    cerrar.addEventListener('click', cerrarPerfil);
    overlay.addEventListener('click', event => {
        if (event.target === overlay) {
            cerrarPerfil();
        }
    });
    document.addEventListener('keydown', event => {
        if (overlay.hidden) {
            return;
        }

        if (event.key === 'Escape') {
            cerrarPerfil();
            return;
        }

        if (event.key === 'Tab') {
            const elementosEnfocables = Array.from(panel.querySelectorAll('button, a[href]'))
                .filter(elemento => !elemento.disabled);
            const primero = elementosEnfocables[0];
            const ultimo = elementosEnfocables[elementosEnfocables.length - 1];
            if (event.shiftKey && document.activeElement === primero) {
                event.preventDefault();
                ultimo.focus();
            } else if (!event.shiftKey && document.activeElement === ultimo) {
                event.preventDefault();
                primero.focus();
            }
        }
    });
}

function configurarBooklet(reproducirEfecto) {
    const pages = Array.from(document.querySelectorAll('.booklet-page'));
    const spread = document.querySelector('.booklet-pages');
    const turnSheet = document.querySelector('.booklet-turn');
    const turnFront = turnSheet.querySelector('.booklet-turn-front img');
    const turnBack = turnSheet.querySelector('.booklet-turn-back img');
    const botonAnterior = document.getElementById('booklet-anterior');
    const botonSiguiente = document.getElementById('booklet-siguiente');
    const progreso = document.getElementById('booklet-progreso');
    const archivos = Array.from({ length: 10 }, (_, indice) => `../assets/pag-bkt-${indice + 1}.png`);
    const imagenesCargadas = new Map();
    let pliegoActual = 0;
    let girando = false;

    function actualizarControles() {
        botonAnterior.disabled = girando || pliegoActual === 0;
        botonSiguiente.disabled = girando || pliegoActual === archivos.length / 2;

        if (pliegoActual === 0) {
            progreso.textContent = `Tapa · 1 de ${archivos.length}`;
        } else if (pliegoActual === archivos.length / 2) {
            progreso.textContent = `Contratapa · ${archivos.length} de ${archivos.length}`;
        } else {
            const primeraPagina = pliegoActual * 2;
            progreso.textContent = `Páginas ${primeraPagina}–${primeraPagina + 1} de ${archivos.length}`;
        }
    }

    function precargarImagen(src) {
        let carga = imagenesCargadas.get(src);
        if (!carga) {
            const imagen = new Image();
            carga = new Promise((resolve, reject) => {
                imagen.onload = () => resolve(imagen);
                imagen.onerror = () => reject(new Error(`No se pudo cargar la página: ${src}`));
            }).then(async imagenCargada => {
                await imagenCargada.decode();
                return imagenCargada;
            });
            imagenesCargadas.set(src, carga);
            carga.catch(() => imagenesCargadas.delete(src));
            imagen.src = src;
        }

        return carga;
    }

    function ponerImagen(pagina, indice) {
        pagina.classList.toggle('is-empty', indice === null);
        if (indice === null) {
            pagina.removeAttribute('src');
            pagina.alt = '';
            return;
        }

        pagina.src = archivos[indice];
        pagina.alt = indice === 0
            ? 'Tapa del booklet'
            : indice === archivos.length - 1
                ? 'Contratapa del booklet'
                : `Página ${indice + 1} del booklet`;
    }

    function paginasDelPliego(indice) {
        if (indice === 0) {
            return [null, 0];
        }
        if (indice === archivos.length / 2) {
            return [archivos.length - 1, null];
        }
        return [indice * 2 - 1, indice * 2];
    }

    function mostrarPliego(indice) {
        const [paginaIzquierda, paginaDerecha] = paginasDelPliego(indice);
        ponerImagen(pages[0], paginaIzquierda);
        ponerImagen(pages[1], paginaDerecha);
        spread.classList.toggle('is-front-cover', indice === 0);
        spread.classList.toggle('is-back-cover', indice === archivos.length / 2);
    }

    function prepararGiro(origen, destino) {
        if (destino > origen) {
            if (origen === 0) {
                return { frente: 0, dorso: 1, paginas: [null, 2], direccion: 'forward' };
            }
            if (origen === archivos.length / 2 - 1) {
                return {
                    frente: archivos.length - 2,
                    dorso: archivos.length - 1,
                    paginas: [archivos.length - 3, null],
                    direccion: 'forward'
                };
            }

            const indicePaginaDerecha = origen * 2;
            return {
                frente: indicePaginaDerecha,
                dorso: indicePaginaDerecha + 1,
                paginas: [indicePaginaDerecha - 1, indicePaginaDerecha + 2],
                direccion: 'forward'
            };
        }

        if (origen === archivos.length / 2) {
            return {
                frente: archivos.length - 1,
                dorso: archivos.length - 2,
                paginas: [archivos.length - 3, null],
                direccion: 'backward'
            };
        }
        if (origen === 1) {
            return { frente: 1, dorso: 0, paginas: [null, 2], direccion: 'backward' };
        }

        const indicePaginaIzquierda = origen * 2 - 1;
        return {
            frente: indicePaginaIzquierda,
            dorso: indicePaginaIzquierda - 1,
            paginas: [indicePaginaIzquierda - 2, indicePaginaIzquierda + 1],
            direccion: 'backward'
        };
    }

    async function girarPliego(direccion) {
        const siguientePliego = pliegoActual + direccion;
        const ultimoPliego = archivos.length / 2;
        if (girando || siguientePliego < 0 || siguientePliego > ultimoPliego) {
            return;
        }

        girando = true;
        actualizarControles();
        let animacion;
        let animacionPliego;

        try {
            const giro = prepararGiro(pliegoActual, siguientePliego);

            const paginasParaCargar = [...new Set([giro.frente, giro.dorso, ...giro.paginas])];
            await Promise.all(paginasParaCargar
                .filter(indice => indice !== null && indice !== undefined)
                .map(indice => precargarImagen(archivos[indice])));

            const muevePliego = pliegoActual === 0
                || pliegoActual === ultimoPliego
                || siguientePliego === 0
                || siguientePliego === ultimoPliego;
            const desplazamientoInicial = pliegoActual === 0
                ? '-25%'
                : pliegoActual === ultimoPliego
                    ? '25%'
                    : '0%';
            const desplazamientoFinal = siguientePliego === 0
                ? '-25%'
                : siguientePliego === ultimoPliego
                    ? '25%'
                    : '0%';

            ponerImagen(turnFront, giro.frente);
            ponerImagen(turnBack, giro.dorso);
            ponerImagen(pages[0], giro.paginas[0]);
            ponerImagen(pages[1], giro.paginas[1]);
            spread.classList.add('is-turning');
            turnSheet.classList.toggle('turn-forward', giro.direccion === 'forward');
            turnSheet.classList.toggle('turn-backward', giro.direccion === 'backward');
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const anguloFinal = giro.direccion === 'forward' ? -180 : 180;
            animacion = turnSheet.animate(
                [
                    { transform: 'rotateY(0deg)', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
                    {
                        offset: 0.48,
                        transform: `rotateY(${anguloFinal * 0.48}deg)`,
                        boxShadow: `${giro.direccion === 'forward' ? '-8px' : '8px'} 0 30px rgba(0, 0, 0, 0.24)`
                    },
                    { transform: `rotateY(${anguloFinal}deg)`, boxShadow: '0 0 0 rgba(0, 0, 0, 0)' }
                ],
                { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' }
            );
            const animaciones = [animacion.finished];
            if (muevePliego) {
                animacionPliego = spread.animate(
                    [
                        { transform: `translateX(${desplazamientoInicial})` },
                        { transform: `translateX(${desplazamientoFinal})` }
                    ],
                    { duration: 900, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' }
                );
                animaciones.push(animacionPliego.finished);
            }
            reproducirEfecto('papel');
            await Promise.all(animaciones);

            pliegoActual = siguientePliego;
            mostrarPliego(pliegoActual);
            animacion.cancel();
            animacion = null;
            if (animacionPliego) {
                animacionPliego.cancel();
                animacionPliego = null;
            }
        } catch (error) {
            console.error('No se pudo completar el giro del booklet.', error);
            mostrarPliego(pliegoActual);
        } finally {
            animacion?.cancel();
            animacionPliego?.cancel();
            turnSheet.classList.remove('turn-forward', 'turn-backward');
            spread.classList.remove('is-turning');
            girando = false;
            actualizarControles();
        }
    }

    botonAnterior.addEventListener('click', () => girarPliego(-1));
    botonSiguiente.addEventListener('click', () => girarPliego(1));
    document.addEventListener('keydown', event => {
        if (!document.getElementById('pantalla-booklet').classList.contains('active')) {
            return;
        }

        if (event.key === 'ArrowLeft') {
            girarPliego(-1);
        } else if (event.key === 'ArrowRight') {
            girarPliego(1);
        }
    });

    mostrarPliego(pliegoActual);
    actualizarControles();
}

// Inicializar el contenido cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    cargarCanciones();
    configurarVideoFondo();
    configurarVisualizador();
    configurarReproductor();
    const reproducirEfecto = configurarBarraSonido();
    configurarPerfil();
    configurarBooklet(reproducirEfecto);
});
