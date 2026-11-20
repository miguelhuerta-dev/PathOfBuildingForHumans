/**
 * The glossary's explanations in Spanish, keyed by the English term. Terms stay
 * as the game writes them (players search and trade by those names); an entry
 * missing here falls back to the English text.
 */
export const GLOSSARY_ES: Record<string, string> = {
  // Attributes
  Strength: "Atributo rojo. Cada 10 puntos dan +5 de vida máxima y 2% más de daño físico cuerpo a cuerpo. Lo piden las gemas rojas y la armadura pesada.",
  Dexterity: "Atributo verde. Cada 10 puntos dan +20 de precisión y 2% más de evasión. Lo piden las gemas verdes, los arcos y el equipo de evasión.",
  Intelligence: "Atributo azul. Cada 10 puntos dan +5 de maná máximo y 2% más de escudo de energía. Lo piden las gemas azules, las varitas y el equipo de escudo de energía.",
  Requirements: "Gemas y objetos necesitan suficiente atributo (y nivel) para usarse. Si te falta, el objeto no hace nada hasta que lo alcances.",

  // Defence
  Life: "Tu salud. Si llega a cero, mueres. La mayoría de builds la acumulan en equipo y pasivas.",
  "Energy Shield": "Una barrera azul que recibe el daño antes que la vida. Se recarga sola un par de segundos después de dejar de recibir daño.",
  "Effective HP (EHP)": "Cuánto daño aguantas antes de morir, contando vida, escudos, mitigación y resistencias. Cuanto más alto, más seguro.",
  Resistances: "Reducen el daño de fuego, frío, rayo y caos. Tope del 75%. La campaña las va bajando (a -60% tras el Acto 10), así que el equipo de endgame debe recuperarlas.",
  Armour: "Reduce el daño físico de los golpes. Funciona mejor contra muchos golpes pequeños que contra uno enorme.",
  Evasion: "Probabilidad de esquivar ataques por completo. No ayuda contra hechizos.",
  Block: "Probabilidad de detener un golpe por completo. El bloqueo de ataques viene de escudos y pasivas; el de hechizos es aparte.",
  "Spell Suppression": "Probabilidad de recibir la mitad de daño de los hechizos. Suele estar en equipo y pasivas de Destreza; las builds que la usan buscan el 100%.",

  // Offence
  DPS: "Daño por segundo: qué tan rápido mata tu habilidad principal. El archivo lo toma del cálculo completo de Path of Building.",
  Hit: "Daño infligido de golpe por un ataque o hechizo. Los golpes pueden ser críticos y aplicar dolencias.",
  "Damage over Time": "Daño constante durante un tiempo (quemadura, veneno, sangrado, degeneración). No puede ser crítico.",
  "Critical Strike": "Un golpe que hace daño extra: importan su probabilidad y su multiplicador. Muchas builds lo ignoran por completo.",
  "Accuracy / Chance to Hit": "Los ataques pueden fallar. La precisión sube tu probabilidad de acertar; por debajo de ~90% pierdes mucho daño. Los hechizos siempre aciertan.",
  "Attack vs Spell": "Los ataques usan tu arma y velocidad de ataque; los hechizos, el daño propio de la gema y la velocidad de lanzamiento. Muchas bonificaciones solo ayudan a uno de los dos.",
  Minions: "Criaturas que luchan por ti (zombis, espectros, espíritus furiosos). Su daño y vida salen de bonificaciones de esbirros, no de las tuyas.",

  // Ailments
  Ignite: "Los golpes de fuego pueden prender a los enemigos, que reciben daño de fuego con el tiempo.",
  "Freeze & Chill": "Los golpes de frío ralentizan (enfriar) o paralizan (congelar) a los enemigos.",
  Shock: "Los golpes de rayo hacen que los enemigos reciban más daño unos segundos.",
  Bleed: "Daño físico de ataque con el tiempo; duele más mientras el enemigo se mueve.",
  Poison: "Daño de caos con el tiempo que se acumula: cada golpe puede añadir otro veneno.",
  Stun: "Un golpe fuerte interrumpe lo que hacías. La recuperación y evasión de aturdimiento te mantienen actuando.",

  // Passive tree
  "Passive Point": "Uno por nivel después del primero, más algunos de misiones. Cada uno asigna una pasiva junto a otra que ya tengas.",
  Notable: "Una pasiva más grande, con nombre y efecto más fuerte, normalmente al final de un grupo.",
  Keystone: "Una pasiva enorme que cambia cómo funciona tu personaje, con una desventaja. Muchas builds se planean en torno a ellas.",
  Mastery: "El centro de un grupo. Al tomar una notable cercana, te deja elegir uno de varios efectos.",
  "Jewel Socket": "Una pasiva que lleva una joya. Algunas joyas (timeless, cluster) cambian las pasivas a su alrededor.",
  Ascendancy: "La especialización de tu clase, elegida en el primer Laberinto. Sus puntos llegan de dos en dos, de los cuatro Laberintos.",
  Labyrinth: "Una mazmorra llena de trampas que se completa cuatro veces (Normal, Cruel, Merciless, Eternal). Cada una da dos puntos de ascendencia.",

  // Items & gems
  Rarity: "Normal (blanco), Mágico (azul, hasta dos mods), Raro (amarillo, hasta seis) y Único (naranja, mods especiales fijos).",
  "Implicit & Explicit": "Los mods implícitos vienen con el tipo base del objeto; los explícitos son los aleatorios que salen encima.",
  "Sockets & Links": "Las gemas van en los engarces de los objetos. Los engarces enlazados dejan que las gemas de soporte cambien la habilidad enlazada: un 6-link son seis engarces conectados.",
  "Skill & Support Gems": "Las gemas de habilidad dan una habilidad; las de soporte mejoran la habilidad a la que están enlazadas. Su color indica el atributo que piden.",
  Flask: "Pociones recargables en tu cinturón: de vida, de maná y de utilidad con efectos temporales. Se recargan al matar.",
  "Gem Vendor": "Las misiones dan gemas, y los vendedores del pueblo venden más al completarlas. Lilly Roth (Acto 6) vende casi todas las gemas a cualquier clase.",

  // Campaign & endgame
  Bandits: "En el Acto 2 puedes ayudar a un señor bandido (Oak, Kraityn o Alira) por una bonificación, o matar a los tres por un punto de pasiva extra.",
  Pantheon: "Dioses que desbloqueas desde el Acto 6: un poder mayor y uno menor a la vez. Capturar almas de jefes de mapa con un Divine Vessel los mejora.",
  Atlas: "El sistema de mapas del endgame tras el Acto 10. Su propio árbol de pasivas cambia qué contenido y recompensas encuentras.",
  "Atlas Passive Tree": "Puntos ganados al completar mapas, gastados en las mecánicas que quieres ver más.",

  // The app's own words
  "Atlas Rating": "La nota del archivo del 1 al 10 de qué tan lista está tu build para su etapa del juego, según su daño y defensas.",
  "Scholar's Verdict": "Una lectura breve de tu build: dónde está y su principal debilidad.",
  "Threat Register": "Los problemas encontrados en tu build, de peor a menor, con lo que te cuesta cada uno y cómo arreglarlo.",
  "Recommended Artifact": "El objeto de tu guía que más mejoraría tu build, medido por Path of Building.",
  "Equipped Artifacts": "Tu equipo puesto, dispuesto como el inventario del juego.",
  "Guide Stage": "Las guías planean la build por pasos (árboles de nivelación, equipo temprano y tardío). El archivo elige el paso según tu progreso; puedes escoger otro.",
};
