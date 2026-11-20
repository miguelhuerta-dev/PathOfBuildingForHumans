/**
 * Spanish texts, keyed by the English text the code is written in. Placeholders
 * in braces ("{count}") are filled in by `t()`. Game names (items, gems,
 * modifiers, passives) stay in English, as the game writes them.
 */
export const es: Record<string, string> = {
  // Language picker
  "Choose your language": "Elige tu idioma",
  "You can change it later in the menu.": "Puedes cambiarlo después desde el menú.",
  "Language": "Idioma",

  // Navigation
  "Character": "Personaje",
  "Guide": "Guía",
  "Atlas": "Atlas",
  "Glossary": "Glosario",
  "About": "Acerca de",
  "MENU": "MENÚ",

  // Section titles
  "Scholar's Verdict": "Veredicto del Erudito",
  "Threat Register": "Registro de Amenazas",
  "Recommended Artifact": "Artefacto Recomendado",
  "Equipped Artifacts": "Artefactos Equipados",
  "Best Next Passives": "Mejores Próximas Pasivas",
  "Your Progress": "Tu Progreso",
  "Choose Your Exile": "Elige a tu Exiliado",
  "Follow a Guide": "Sigue una Guía",
  "Guide Stages": "Etapas de la Guía",
  "Artifacts of this Stage": "Artefactos de esta Etapa",
  "Gem Links": "Gemas Enlazadas",
  "Passive Tree": "Árbol de Pasivas",
  "You and the Guide": "Tú y la Guía",
  "Ascension Path": "Camino de Ascensión",
  "The Bandits": "Los Bandidos",
  "The Pantheon": "El Panteón",
  "The Atlas": "El Atlas",
  "Atlas Progress": "Progreso del Atlas",
  "Atlas Records": "Registros del Atlas",
  "The Glossary": "El Glosario",
  "The Forge": "La Forja",

  // Dashboard
  "Unknown Exile": "Exiliado desconocido",
  "LEVEL": "NIVEL",
  "Main skill: {skill}": "Habilidad principal: {skill}",
  "BUILD HEALTH": "SALUD DE LA BUILD",
  "PRIORITY": "PRIORIDAD",
  "Excellent": "Excelente",
  "Good": "Buena",
  "Fragile": "Frágil",
  "Struggling": "En apuros",
  "Demo character. Open the desktop app to connect your own exile.":
    "Personaje de demostración. Abre la app de escritorio para conectar a tu propio exiliado.",
  "Refreshing… showing your last session ({time})": "Actualizando… mostrando tu última sesión ({time})",
  "Consulting the archive…": "Consultando el archivo…",
  "Updated at {time}": "Actualizado a las {time}",
  "Not loaded yet": "Aún sin cargar",
  "Last zone: {zone}": "Última zona: {zone}",
  "Refresh when I change zone": "Actualizar al cambiar de zona",
  "Public profiles do not say which bandit you helped, and it changes your stats.":
    "Los perfiles públicos no dicen a qué bandido ayudaste, y eso cambia tus estadísticas.",
  "Act 2 bandit": "Bandido del Acto 2",
  "Killed all": "Los maté a todos",
  "Helped Alira": "Ayudé a Alira",
  "Helped Kraityn": "Ayudé a Kraityn",
  "Helped Oak": "Ayudé a Oak",
  "REFRESH NOW": "ACTUALIZAR AHORA",
  "Which bandit did you help in Act 2?": "¿A qué bandido ayudaste en el Acto 2?",
  "Your public profile does not say, and it changes your resistances and more.":
    "Tu perfil público no lo dice, y cambia tus resistencias y más.",
  "SHOW FEWER": "MOSTRAR MENOS",
  "SHOW ALL {count} THREATS": "MOSTRAR LAS {count} AMENAZAS",
  "Key stats": "Estadísticas clave",
  "No weaknesses found for {stage}.": "No se encontraron debilidades para {stage}.",
  "“A single weakness can undo an empire.”": "«Una sola debilidad puede derrumbar un imperio.»",
  "— THE ATLAS ARCHIVIST": "— EL ARCHIVISTA DEL ATLAS",
  "Nothing in your guide beats your gear at this stage. Pick a later stage to plan your next upgrades.":
    "Nada de tu guía supera tu equipo en esta etapa. Elige una etapa posterior para planear tus próximas mejoras.",
  "Load the guide you are following and the archive will tell you which item to chase next.":
    "Carga la guía que sigues y el archivo te dirá qué objeto buscar después.",
  "OPEN THE GUIDE": "ABRIR LA GUÍA",
  "LOAD A GUIDE": "CARGAR UNA GUÍA",
  "Ready for {stage}": "Lista para {stage}",
  "Primary Weakness": "Debilidad principal",
  "Estimated Gain": "Ganancia estimada",
  "Recommended Action": "Acción recomendada",
  "CRITICAL": "CRÍTICA",
  "WARNING": "AVISO",
  "MINOR": "MENOR",
  "Remedy:": "Remedio:",
  "ATLAS RATING": "PUNTUACIÓN DEL ATLAS",
  "Atlas rating": "Puntuación del Atlas",

  // Stages of the game
  "Early campaign": "Campaña temprana",
  "Late campaign": "Campaña avanzada",
  "Early maps": "Primeros mapas",
  "Red maps and bosses": "Mapas rojos y jefes",

  // Elements and damage
  "Fire": "Fuego",
  "Cold": "Frío",
  "Lightning": "Rayo",
  "Chaos": "Caos",
  "fire": "fuego",
  "cold": "frío",
  "lightning": "rayo",
  "chaos": "caos",
  "physical": "físico",
  "strong": "fuerte",
  "solid": "sólido",
  "low": "bajo",

  // Analysis
  "{Element} Resistance {value}% of {max}%": "Resistencia al {Element} {value}% de {max}%",
  "{Element} Resistance {value}%": "Resistencia al {Element} {value}%",
  "You take {extra}% more {element} damage than you would at your {max}% maximum.":
    "Recibes un {extra}% más de daño de {element} que con tu máximo de {max}%.",
  "{Element} hits land harder than they should.": "Los golpes de {Element} te entran más fuerte de lo que deberían.",
  "Add {element} resistance on rings, belt or boots until you reach {target}%.":
    "Añade resistencia al {element} en anillos, cinturón o botas hasta llegar al {target}%.",
  "Add {element} resistance": "Añade resistencia al {element}",
  "Little resistance to spare": "Poco margen de resistencia",
  "Your {elements} resistance has under {over}% over the cap: a curse or a map mod takes you below it.":
    "Tu resistencia a {elements} tiene menos de {over}% por encima del tope: una maldición o un mod de mapa te deja por debajo.",
  "Aim for 20-30% over the cap on each element, or carry curse immunity.":
    "Busca un 20-30% por encima del tope en cada elemento, o lleva inmunidad a maldiciones.",
  "Overcap your resistances": "Sube tus resistencias por encima del tope",
  "Chaos damage and poison bypass energy shield and hit you hard.":
    "El daño de caos y el veneno atraviesan el escudo de energía y te golpean fuerte.",
  "Look for chaos resistance on jewellery or an Amethyst Flask, and aim for at least 0%.":
    "Busca resistencia al caos en joyería o un Amethyst Flask, y apunta al menos al 0%.",
  "Add chaos resistance": "Añade resistencia al caos",
  "Weak to {kind} hits": "Débil a los golpes de {kind}",
  "The biggest {kind} hit you survive is {weakest}, against about {typical} for other damage.":
    "El golpe de {kind} más grande que aguantas es de {weakest}, frente a unos {typical} para otros daños.",
  "Add armour, physical damage reduction or more life.": "Añade armadura, reducción de daño físico o más vida.",
  "Add chaos resistance or more life; energy shield does not stop chaos damage.":
    "Añade resistencia al caos o más vida; el escudo de energía no detiene el daño de caos.",
  "Raise your {kind} resistance and life before anything else.": "Sube tu resistencia al {kind} y tu vida antes que nada.",
  "Shore up against {kind} hits": "Refuérzate contra los golpes de {kind}",
  "No life recovery": "Sin recuperación de vida",
  "Without regeneration or leech, every hit stays with you until you drink a flask.":
    "Sin regeneración ni robo de vida, cada golpe se queda contigo hasta que bebes un frasco.",
  "Get life regeneration on the tree or gear, life leech, or a Vitality aura.":
    "Consigue regeneración de vida en el árbol o el equipo, robo de vida o el aura Vitality.",
  "Add life recovery": "Añade recuperación de vida",
  "You can be frozen": "Te pueden congelar",
  "Frozen, you cannot move or attack while you keep taking hits.":
    "Congelado, no puedes moverte ni atacar mientras sigues recibiendo golpes.",
  'Use a flask with the "of Heat" suffix, or get freeze immunity from the tree or gear.':
    'Usa un frasco con el sufijo "of Heat", o consigue inmunidad a la congelación en el árbol o el equipo.',
  "Get freeze immunity": "Consigue inmunidad a la congelación",
  "Low effective HP ({ehp})": "Vida efectiva baja ({ehp})",
  "Content at this stage can take {amount} or more in a single burst.":
    "El contenido de esta etapa puede quitarte {amount} o más de un solo golpe.",
  "Prioritise life, energy shield or armour on your next gear upgrades.":
    "Prioriza vida, escudo de energía o armadura en tus próximas mejoras de equipo.",
  "Prioritise life": "Prioriza la vida",
  "Spell Suppression {value}%": "Supresión de hechizos {value}%",
  "You invested in suppression but are {short}% short of the cap, so spells still land at full damage sometimes.":
    "Invertiste en supresión pero te falta un {short}% para el tope, así que a veces los hechizos te entran con todo su daño.",
  "Cap it at 100% with suppression on boots, gloves or the passive tree.":
    "Llévala al 100% con supresión en botas, guantes o el árbol de pasivas.",
  "Cap spell suppression": "Llega al tope de supresión",
  "Not enough mana for {skill}": "No tienes maná suficiente para {skill}",
  "your main skill": "tu habilidad principal",
  "It costs {cost} mana and you have {mana} free after reservations.":
    "Cuesta {cost} de maná y te quedan {mana} libres tras las reservas.",
  "Reserve less, add mana, or link Inspiration or a cost-reducing support.":
    "Reserva menos, añade maná o enlaza Inspiration u otra gema que reduzca el coste.",
  "Fix your mana": "Arregla tu maná",
  "Chance to Hit {value}%": "Probabilidad de impacto {value}%",
  "About {miss}% of your attacks miss.": "Alrededor del {miss}% de tus ataques fallan.",
  "Add accuracy with Precision, accuracy on gear or the passive tree.":
    "Añade precisión con Precision, con equipo o con el árbol de pasivas.",
  "Add accuracy": "Añade precisión",
  "Movement speed {value}": "Velocidad de movimiento {value}",
  "Slow movement makes mapping feel sluggish and dodging harder.":
    "Moverte lento hace los mapas pesados y esquivar más difícil.",
  "Get 25-30% movement speed on boots and use a Quicksilver Flask.":
    "Consigue 25-30% de velocidad de movimiento en botas y usa un Quicksilver Flask.",
  "Get movement speed": "Consigue velocidad de movimiento",
  "the defence has gaps that will get you killed": "la defensa tiene huecos que te van a matar",
  "the defence holds up with a few soft spots": "la defensa aguanta con algunos puntos débiles",
  "the defence is solid": "la defensa es sólida",
  "A level {level} {who} using {skill}.": "Un {who} de nivel {level} que usa {skill}.",
  "A level {level} {who}.": "Un {who} de nivel {level}.",
  "For {stage}, damage is {damage} and {defence}.": "Para {stage}, el daño es {damage} y {defence}.",
  "Main weakness: {weakness}.": "Debilidad principal: {weakness}.",
  "No critical weaknesses found.": "No se encontraron debilidades críticas.",
  "Keep upgrading": "Sigue mejorando",
  "None found": "Ninguna",
  "Small": "Pequeña",
  "Gear on track": "Equipo al día",
  "Load a guide": "Carga una guía",
  "Replace {slot}": "Reemplaza {slot}",
  "Follow your guide's next stage": "Sigue la próxima etapa de tu guía",

  // Equipment slots
  "Weapon 1": "Arma 1",
  "Weapon 2": "Arma 2",
  "Helmet": "Casco",
  "Body Armour": "Armadura",
  "Gloves": "Guantes",
  "Boots": "Botas",
  "Belt": "Cinturón",
  "Amulet": "Amuleto",
  "Ring 1": "Anillo 1",
  "Ring 2": "Anillo 2",
};
