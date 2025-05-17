// Referencias al menú y botones
const menu      = document.getElementById('menu-principal');
const btnLocal  = document.getElementById('btn-local');
const btnOnline = document.getElementById('btn-online');
const btnInst   = document.getElementById('btn-instrucciones');
const btnAjust  = document.getElementById('btn-ajustes');
const btnSalir  = document.getElementById('btn-salir');

// Función para iniciar partida local
function iniciarLocal() {
  document.querySelector('.menu').style.display = 'none';
  document.getElementById('juego').style.display = 'block';
  document.getElementById('puntajes').style.setProperty('display', 'block', 'important');
;
  reiniciarPartida(true);
}
// Aquí podrás crear iniciarOnline(), mostrarInstrucciones(), etc.
btnLocal.addEventListener('click', iniciarLocal);
// btnOnline.addEventListener('click', iniciarOnline);
// btnInst.addEventListener('click', mostrarInstrucciones);
// btnAjust.addEventListener('click', mostrarAjustes);
// btnSalir.addEventListener('click', () => window.close());

console.log('🟢 [DEBUG] Cargo mi script.js modificado');
let dragSrcIndex = null;
let mazo = [];
const palos = ['copa', 'oro', 'basto', 'espada'];
const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
palos.forEach(palo => {
  numeros.forEach(numero => {
    mazo.push(`${numero}_${palo}`);
  });
});
function barajar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
barajar(mazo);

// 2. Variables de juego
let descartesContados = 0;       // Nuevo: para limitar el crecimiento del pozo
let manoJugador     = mazo.splice(0, 7);
let manoOponente    = mazo.splice(0, 7);
let pozo            = [mazo.pop()];
let turno           = 'jugador';
let yaRobo          = false;
let bloqueado       = false;     // <- ¡requerido!
let rondaFinalizada = false;     // <- ¡requerido!
let oponenteVisible = true;
let puntajeJugador = 0;
let puntajeOponente = 0;

// 3. Referencias al DOM
const divMano     = document.getElementById('mano-jugador');
const divOponente = document.getElementById('mano-oponente');
const mazoImg     = document.getElementById('mazo-carta');
const toggleBtn   = document.getElementById('toggle-oponente');
const puntajesDiv = document.getElementById('puntajes');
// Ocultar marcador al iniciar
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('puntajes').style.setProperty('display', 'none', 'important');
});
// Nuevo: referencia al pozo y variable global
const pozoContenedor = document.getElementById('pozo-contenedor');
function actualizarEstadoMazo() {
  if (rondaFinalizada) return;

  // 1) Si el mazo está vacío pero hay descartes, reciclar:
  if (mazo.length === 0 && pozo.length > 0) {
    // notificar al jugador

    // reciclar descartes
    mazo = pozo.slice();
    pozo = [];
    barajar(mazo);
    renderizarPozo();
  }

  // 2) Si tras reciclar sigue vacío, desactivar el robo
  if (mazo.length === 0) {
    mazoImg.style.cursor = 'not-allowed';
    mazoImg.removeEventListener('click', robarDelMazo);
  }
}

function robarDelMazo() {
  // Sólo robar si:
  // 1) La mano tiene 7 cartas,
  // 2) Es turno del jugador,
  // 3) No se terminó la ronda,
  // 4) No ha robado aún,
  // 5) No está bloqueado,
  // 6) Queda mazo.
  if (
    manoJugador.length !== 7 ||
    turno !== 'jugador'   ||
    rondaFinalizada      ||
    yaRobo               ||
    bloqueado            ||
    mazo.length === 0
  ) return;

  bloqueado = true;
  manoJugador.push(mazo.pop());
  yaRobo = true;

  renderizarMano();
  renderizarPozo();
  actualizarEstadoMazo();

  setTimeout(() => bloqueado = false, 500);
}


// Renderiza todas las cartas apiladas en el pozo
function renderizarPozo() {
  pozoContenedor.innerHTML = '';

  const maxVisible = 10;             // límite “a lo ancho”
  // si ya hay más de 5 descartes, sólo seguimos mostrando 5 cartas
  const limiteReal = descartesContados > 5 ? 5 : maxVisible;
  const inicio    = Math.max(0, pozo.length - limiteReal);

  pozo.slice(inicio).forEach((nombreCarta, idx) => {
    const img = document.createElement('img');

    if (nombreCarta === 'dorso') {
      img.src = 'cartas/dorso.png';
      img.classList.add('carta-pozo-final');
    } else {
      img.src = `cartas/${nombreCarta}.png`;
      img.classList.add('carta-pozo-stack');
      img.style.setProperty('--i', idx);
    }

    img.alt = nombreCarta;
    // Sólo la última carta visible responde al click
    if (idx === pozo.slice(inicio).length - 1 && !rondaFinalizada) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', robarDelPozo);
    }

    pozoContenedor.appendChild(img);
  });

  if (rondaFinalizada) {
    pozoContenedor.style.opacity       = '0.4';
    pozoContenedor.style.pointerEvents = 'none';
  } else {
    pozoContenedor.style.opacity       = '1';
    pozoContenedor.style.pointerEvents = 'auto';
  }
}
document.getElementById('puntajes').style.display = 'none';
// 4. Renderizado
function renderizarPuntajes() {
  puntajesDiv.textContent = `Jugador: ${puntajeJugador} pts | Oponente: ${puntajeOponente} pts`;
}
// Variable global para el índice de la carta que arrastramos

function renderizarMano() {
    // Desactivar mazo cuando no se cumplan las condiciones de robo
    if (
      manoJugador.length !== 7 ||
      turno !== 'jugador' ||
      rondaFinalizada  ||
      yaRobo
    ) {
      mazoImg.style.pointerEvents = 'none';
      mazoImg.style.cursor        = 'not-allowed';
    } else {
      mazoImg.style.pointerEvents = 'auto';
      mazoImg.style.cursor        = 'pointer';
    }
  
  while (manoJugador.length > 8) mazo.unshift(manoJugador.pop());
  divMano.innerHTML = '';
  manoJugador.forEach((nombreCarta, idx) => {
    const img = document.createElement('img');
    img.src = `cartas/${nombreCarta}.png`;
    img.alt = nombreCarta;
    img.classList.add('carta');
    img.draggable = true;
    img.style.setProperty('--i', idx);

     // --- DRAG & DROP BÁSICO en renderizarMano() ---
img.addEventListener('dragstart', (e) => {
  dragSrcIndex = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', nombreCarta);
  img.classList.add('dragging');
});
img.addEventListener('dragover', (e) => {
  e.preventDefault();
  img.classList.add('drag-over');
});
img.addEventListener('dragleave', () => {
  img.classList.remove('drag-over');
});
img.addEventListener('drop', (e) => {
  e.preventDefault();
  img.classList.remove('drag-over');
  if (dragSrcIndex === null || dragSrcIndex === idx) return;
  // intercambio
  const temp = manoJugador[dragSrcIndex];
  manoJugador[dragSrcIndex] = manoJugador[idx];
  manoJugador[idx] = temp;
  dragSrcIndex = null;
  renderizarMano();
});
img.addEventListener('dragend', () => {
  img.classList.remove('dragging');
  dragSrcIndex = null;
  document.querySelectorAll('.carta.drag-over')
          .forEach(el => el.classList.remove('drag-over'));
});
      divMano.appendChild(img);
    img.classList.add('shuffle');
setTimeout(() => img.classList.remove('shuffle'), 300);
  });
  
  if (manoJugador.length !== 7 || turno !== 'jugador' || rondaFinalizada || yaRobo) {
    mazoImg.style.pointerEvents = 'none';
    mazoImg.style.cursor = 'not-allowed';
  } else {
    mazoImg.style.pointerEvents = 'auto';
    mazoImg.style.cursor = 'pointer';
  }
}
function renderizarOponente() {
  divOponente.innerHTML = '';
  manoOponente.forEach((_, idx) => {
    const img = document.createElement('img');
    img.src = 'cartas/dorso.png';  // Siempre mostrar dorso
    img.alt = 'Reverso';
    img.classList.add('carta');
    img.style.setProperty('--i', idx);
    img.style.pointerEvents = 'none';
    divOponente.appendChild(img);
  });
}

// 5. Sonido y modal
function reproducirSonidoVictoria() {
  const audio = new Audio('sonidos/victoria.mp3');
  audio.volume = 0.3;
  audio.play();
}
function mostrarResumen({ titulo, mensajeHTML, tipo = null }) {
  const modal = document.getElementById('modal-resumen');
  const tituloElem = document.getElementById('titulo-resumen');
  const detalleElem = document.getElementById('detalle-resumen');

  tituloElem.textContent = titulo;

  // Si hay tipo "victoria" o "derrota", insertamos imagen arriba
  let imagenHTML = '';
  if (tipo === 'victoria') {
    imagenHTML = `<img src="img/victoria.png" alt="Ganaste" style="max-width: 100%; margin-bottom: 20px;" />`;
  } else if (tipo === 'derrota') {
    imagenHTML = `<img src="img/derrota.png" alt="Perdiste" style="max-width: 100%; margin-bottom: 20px;" />`;
  }

  detalleElem.innerHTML = imagenHTML + mensajeHTML;
  modal.style.display = 'flex';
}
function cerrarResumen() {
  document.getElementById('modal-resumen').style.display = 'none';
}

// 6. Acciones jugador
function robarDelPozo() {
  if (manoJugador.length !== 7) return;
  if (rondaFinalizada || turno !== 'jugador' || yaRobo || pozo.length === 0 || manoJugador.length >= 8) return;
  manoJugador.push(pozo.pop());
  yaRobo = true;
  renderizarMano();
  renderizarPozo();
}
function descartarCarta(nombreCarta) {
  if (turno !== 'jugador' || !yaRobo || manoJugador.length !== 8) return;
const idxDesc = manoJugador.indexOf(nombreCarta);
if (idxDesc > -1) {
  manoJugador.splice(idxDesc, 1);
}

  const cartaImg = [...document.querySelectorAll('.carta')].find(img => img.alt === nombreCarta);
  if (cartaImg) cartaImg.classList.add('carta-descartada');
  pozoContenedor.classList.add('animate');

  // Aumentamos el contador de descartes
  descartesContados++;



  setTimeout(() => {
    pozo.push(nombreCarta);
    yaRobo = false;
    renderizarMano();
    renderizarPozo();
    verificarFinDeTurno('jugador');
  }, 500);
  return;
  renderizarMano();
}

// 7. Turno oponente
function turnoOponente() {
  turno = 'oponente';
  yaRobo = false;
  setTimeout(() => {
    const robaPozo = Math.random() < 0.5;
    let carta;
    if (robaPozo && pozo.length) carta = pozo.pop();
    else carta = mazo.pop();
    if (carta) manoOponente.push(carta);
    renderizarPozo();
    renderizarOponente();
    setTimeout(() => {
      const idx = Math.floor(Math.random() * manoOponente.length);
      const desc = manoOponente.splice(idx, 1)[0];
      pozo.push(desc);
      renderizarPozo();
      renderizarOponente();
      verificarFinDeTurno('oponente');
    }, 1000);
  }, 1000);
}

// 8. Evaluar combinaciones
function evaluarCombinaciones(mano) {
  const usadas = new Set();
  const combinaciones = [];
  const cartas = mano.map(nombre => {
    const [n, palo] = nombre.split('_');
    return { nombre, numero: parseInt(n), palo };
  });
  const nums = {};
  cartas.forEach(c => {
    nums[c.numero] = nums[c.numero] || [];
    nums[c.numero].push(c);
  });
  Object.values(nums).forEach(grupo => {
    if (grupo.length >= 3) {
      grupo.forEach(c => usadas.add(c.nombre));
      combinaciones.push({ tipo: 'trio', cartas: grupo.map(c => c.nombre) });
    }
  });
  const pal = {};
  cartas.forEach(c => {
    pal[c.palo] = pal[c.palo] || [];
    pal[c.palo].push(c);
  });
  Object.values(pal).forEach(grupo => {
    const ord = grupo.sort((a, b) => a.numero - b.numero);
    let temp = [ord[0]];
    for (let i = 1; i < ord.length; i++) {
      if (ord[i].numero === ord[i - 1].numero + 1) temp.push(ord[i]);
      else {
        if (temp.length >= 3) {
          temp.forEach(c => usadas.add(c.nombre));
          combinaciones.push({ tipo: 'escalera', cartas: temp.map(c => c.nombre) });
        }
        temp = [ord[i]];
      }
    }
    if (temp.length >= 3) {
      temp.forEach(c => usadas.add(c.nombre));
      combinaciones.push({ tipo: 'escalera', cartas: temp.map(c => c.nombre) });
    }
  });
  let esChinchon = false;
  Object.values(pal).forEach(grupo => {
    if (grupo.length === 7) {
      const numsArr = grupo.map(c => c.numero).sort((a, b) => a - b);
      const consec = numsArr.every((n, i, arr) => i === 0 || n === arr[i - 1] + 1);
      if (consec) esChinchon = true;
    }
  });
  const sin = cartas.filter(c => !usadas.has(c.nombre));
  const puntos = sin.reduce((acc, c) => acc + (c.numero >= 10 ? 10 : c.numero), 0);
  return { esChinchon, puntosSobrantes: puntos, combinaciones, sinCombinar: sin.map(c => c.nombre) };
}

// 9. Verificar fin de turno y puntaje
function verificarFinDeTurno(jugador) {
  setTimeout(() => {
    if (jugador === 'jugador') {
      turnoOponente();
    } else {
      turno = 'jugador';
      yaRobo = false;
      renderizarMano();
    }
  }, 3000);
}

// 10. Reiniciar partida
function reiniciarPartida(completa) {
  descartesContados = 0;
  mazo = [];
  palos.forEach(p => numeros.forEach(n => mazo.push(`${n}_${p}`)));
  barajar(mazo);

  manoJugador = mazo.splice(0, 7); yaRobo = false;
  manoOponente = mazo.splice(0, 7);
  pozo = [mazo.pop()];

  puntajeJugador = completa ? 0 : puntajeJugador;
  puntajeOponente = completa ? 0 : puntajeOponente;


  rondaFinalizada = false;
  turno = 'jugador';
  yaRobo = false;
  const juegoContenedor = document.getElementById('juego');
  juegoContenedor.classList.add('fade');
  setTimeout(() => juegoContenedor.classList.remove('fade'), 800);
  
  renderizarPuntajes();
  renderizarMano();
  renderizarOponente();
  renderizarPozo();
}

// 11. Cortar manual
function cortarMano() {
  if (turno !== 'jugador') return;
  const evalObj = evaluarCombinaciones(manoJugador);

  // 1) CHINCHÓN PURO
  if (evalObj.esChinchon) {
    // Suena y muestro “¡GANASTE!”
    reproducirSonidoVictoria();
    mostrarResumen({
      titulo: '¡GANASTE!',
      mensajeHTML: `
        <p>¡Chinchón!<br>
        Combinaciones:<br>
        ${evalObj.combinaciones
          .map(c => `<em>${c.tipo}:</em> ${c.cartas.join(', ')}`)
          .join('<br>')}
        </p>
      `,
      tipo: 'victoria'
    });
    rondaFinalizada = true;
    return;
  }

  // 2) CORTE NORMAL (<=7 puntos)
  if (evalObj.puntosSobrantes <= 7) {
    reproducirSonidoVictoria();
    mostrarResumen({
  titulo: '¡Ganaste la ronda!',
  mensajeHTML: `<p>Tus puntos sobrantes: ${evalObj.puntosSobrantes} pts.<br>Puntos sumados del oponente: ${evalOponente.puntosSobrantes} pts.</p>`,
  tipo: 'victoria'
});
const evalOponente = evaluarCombinaciones(manoOponente);
puntajeJugador += evalOponente.puntosSobrantes;
renderizarPuntajes();
    rondaFinalizada = true;
    return;
  }

  // 3) CORTE INVÁLIDO
  mostrarResumen({ 
    titulo: '¡Corte inválido!', 
    mensajeHTML: '<p>Pierdes la ronda por corte mal.</p>' 
  });
  puntajeJugador += evalObj.puntosSobrantes;
  renderizarPuntajes();
  rondaFinalizada = true;
}
// 11.5 Intentar corte desde pozo (drag-and-drop final de ronda)
function intentarCorteDesdePozo(cartaDescartada) {
  if (rondaFinalizada || turno !== 'jugador' || !yaRobo || manoJugador.length !== 8) return;

  // 1) Sacamos la carta de la mano
  manoJugador = manoJugador.filter(c => c !== cartaDescartada);
  // 2) La ponemos boca abajo en el pozo
  pozo.push('dorso');

  // 3) Actualizamos la UI inmediatamente
  renderizarMano();
  renderizarPozo();

  // 4) Ahora evaluamos si el corte es válido
  const evalObj = evaluarCombinaciones(manoJugador);
  if (evalObj.esChinchon || evalObj.puntosSobrantes <= 7) {
    // Corte válido
    reproducirSonidoVictoria();
    rondaFinalizada = true;
    actualizarEstadoMazo();
    verificarFinDeTurno('jugador');
  } else {
    // Corte inválido: penalización
    mostrarResumen({
      titulo: '¡Corte inválido!',
      mensajeHTML: '<p>Pierdes la ronda por corte mal.</p>'
    });
    puntajeJugador += evalObj.puntosSobrantes;
    renderizarPuntajes();
    rondaFinalizada = true;
    actualizarEstadoMazo();
    reiniciarPartida(false);
  }
}

// 12. Listeners iniciales
mazoImg.addEventListener('click', robarDelMazo);
pozoContenedor.addEventListener('click', robarDelPozo);
// Permitir arrastrar carta al POZO para descartarla
pozoContenedor.addEventListener('dragover', e => {
  e.preventDefault();
  pozoContenedor.classList.add('hover');
});

pozoContenedor.addEventListener('dragleave', () => {
  pozoContenedor.classList.remove('hover');
});

pozoContenedor.addEventListener('drop', e => {
  e.preventDefault();
  pozoContenedor.classList.remove('hover');
  const carta = e.dataTransfer.getData('text/plain');
  if (carta) {
    const imgAnimada = document.querySelector(`img[alt="${carta}"]`);
    if (imgAnimada) imgAnimada.classList.add('carta-descartada');
    pozoContenedor.classList.add('animate');
    setTimeout(() => pozoContenedor.classList.remove('animate'), 600);
    descartarCarta(carta);
}
});

const zonaCorte = document.getElementById('zona-corte');
zonaCorte.addEventListener('dragover', e => { 
  e.preventDefault(); 
  zonaCorte.classList.add('hover');
});
zonaCorte.addEventListener('dragleave', () => {
  zonaCorte.classList.remove('hover');
});
zonaCorte.addEventListener('drop', e => {
  e.preventDefault();
  zonaCorte.classList.remove('hover');
  zonaCorte.classList.add('animate');
  setTimeout(()=> zonaCorte.classList.remove('animate'), 500);
  const carta = e.dataTransfer.getData('text/plain');
  if (carta) intentarCorteDesdePozo(carta);
});



// 13. Inicialización
renderizarPuntajes();
renderizarMano();
renderizarOponente();
renderizarPozo();
