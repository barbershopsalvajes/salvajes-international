import type { Lang } from '../i18n/ui.ts';

export interface ServiceContent {
  title: string;
  short: string;
  seoTitle: string;
  seoDescription: string;
  problem: string;
  problemPoints: string[];
  how: { t: string; d: string }[];
  benefits: string[];
  example: { title: string; text: string; flow: string[] };
  formValue: string; // valor del selector "Servicio de interés"
}

export interface Service {
  id: string;
  icon: 'agent' | 'flow' | 'chat' | 'funnel' | 'grid' | 'compass';
  slug: Record<Lang, string>;
  content: Record<Lang, ServiceContent>;
}

export const services: Service[] = [
  {
    id: 'agents',
    icon: 'agent',
    slug: { es: 'agentes-inteligencia-artificial', en: 'ai-agents' },
    content: {
      es: {
        title: 'Agentes de inteligencia artificial',
        short: 'Asistentes inteligentes que responden consultas, gestionan solicitudes, recopilan información y ejecutan tareas.',
        seoTitle: 'Agentes de IA para empresas · RESUELVE INTELLECT',
        seoDescription:
          'Diseñamos agentes de inteligencia artificial para empresas que responden consultas, gestionan solicitudes y ejecutan tareas conectados a tus herramientas. Barcelona, España.',
        problem:
          'Tu equipo dedica cada día horas a responder las mismas preguntas, buscar información en distintos sistemas y ejecutar tareas sencillas que interrumpen el trabajo importante.',
        problemPoints: [
          'Preguntas repetidas que consumen tiempo cualificado.',
          'Información repartida en documentos, correos y aplicaciones.',
          'Tareas que se retrasan porque dependen de una persona concreta.',
        ],
        how: [
          { t: 'Definimos su misión', d: 'Qué debe resolver el agente, con qué límites y cuándo debe pasar el caso a una persona.' },
          { t: 'Le damos conocimiento', d: 'Lo conectamos con tus documentos, tarifas, procedimientos y bases de datos autorizadas.' },
          { t: 'Le damos capacidad de acción', d: 'Integramos agenda, CRM, correo o ERP para que pueda ejecutar tareas, no solo conversar.' },
          { t: 'Supervisamos y mejoramos', d: 'Revisamos conversaciones y resultados para afinar su comportamiento de forma continua.' },
        ],
        benefits: [
          'Disponibilidad 24/7 sin aumentar plantilla.',
          'Respuestas coherentes basadas en la información de tu empresa.',
          'Tu equipo se concentra en tareas de mayor valor.',
          'Escalado a una persona cuando el caso lo requiere.',
        ],
        example: {
          title: 'Agente interno de soporte para un despacho profesional',
          text: 'Los empleados preguntan al agente por procedimientos, plantillas o el estado de un expediente. El agente consulta las fuentes internas, responde citando el documento y, si hace falta, abre una tarea al responsable.',
          flow: ['Pregunta del empleado', 'Búsqueda en fuentes internas', 'Respuesta con referencia', 'Tarea al responsable si procede'],
        },
        formValue: 'Agentes de inteligencia artificial',
      },
      en: {
        title: 'Artificial intelligence agents',
        short: 'Intelligent assistants that answer queries, handle requests, collect information and carry out tasks.',
        seoTitle: 'AI agents for business · RESUELVE INTELLECT',
        seoDescription:
          'We design AI agents for businesses that answer queries, handle requests and carry out tasks connected to your tools. Barcelona, Spain.',
        problem:
          'Every day your team spends hours answering the same questions, searching for information across systems and doing simple tasks that interrupt important work.',
        problemPoints: [
          'Repeated questions that eat up skilled time.',
          'Information scattered across documents, emails and apps.',
          'Tasks delayed because they depend on one specific person.',
        ],
        how: [
          { t: 'We define its mission', d: 'What the agent must solve, within which limits, and when it should hand over to a person.' },
          { t: 'We give it knowledge', d: 'We connect it to your authorised documents, pricing, procedures and databases.' },
          { t: 'We give it the ability to act', d: 'We integrate calendar, CRM, email or ERP so it can carry out tasks, not just chat.' },
          { t: 'We supervise and improve', d: 'We review conversations and outcomes to keep refining its behaviour.' },
        ],
        benefits: [
          '24/7 availability without growing headcount.',
          'Consistent answers based on your own company information.',
          'Your team focuses on higher-value work.',
          'Hand-over to a person whenever the case requires it.',
        ],
        example: {
          title: 'Internal support agent for a professional firm',
          text: 'Employees ask the agent about procedures, templates or the status of a case. The agent checks internal sources, replies citing the document and, if needed, opens a task for the person in charge.',
          flow: ['Employee question', 'Search internal sources', 'Answer with reference', 'Task to owner if needed'],
        },
        formValue: 'AI agents',
      },
    },
  },
  {
    id: 'process',
    icon: 'flow',
    slug: { es: 'automatizacion-de-procesos', en: 'process-automation' },
    content: {
      es: {
        title: 'Automatización de procesos',
        short: 'Conectamos aplicaciones y automatizamos operaciones administrativas y empresariales.',
        seoTitle: 'Automatización de procesos empresariales · RESUELVE INTELLECT',
        seoDescription:
          'Automatización empresarial: conectamos tus aplicaciones y automatizamos facturas, altas, informes y tareas administrativas. Agencia de automatización en Barcelona, España.',
        problem:
          'Copiar datos de un sistema a otro, preparar informes a mano o perseguir aprobaciones por correo son tareas que se repiten a diario y generan errores.',
        problemPoints: [
          'Errores humanos al transcribir información.',
          'Procesos lentos que dependen de recordatorios manuales.',
          'Falta de trazabilidad: nadie sabe en qué punto está cada cosa.',
        ],
        how: [
          { t: 'Mapeamos el proceso', d: 'Documentamos cada paso actual, quién lo hace, con qué herramienta y cuánto tarda.' },
          { t: 'Diseñamos el flujo ideal', d: 'Eliminamos pasos innecesarios y decidimos qué automatizar y qué debe revisar una persona.' },
          { t: 'Conectamos las herramientas', d: 'Integramos tus aplicaciones mediante APIs y plataformas como Make, con IA donde aporta valor.' },
          { t: 'Monitorizamos', d: 'Alertas ante errores, registros de cada ejecución y métricas de tiempo ahorrado.' },
        ],
        benefits: [
          'Menos errores y datos coherentes entre sistemas.',
          'Procesos que se ejecutan solos, a cualquier hora.',
          'Trazabilidad completa de cada operación.',
          'Equipo liberado de tareas mecánicas.',
        ],
        example: {
          title: 'Facturas de proveedores sin intervención manual',
          text: 'Las facturas llegan por correo. El sistema extrae proveedor, importe y vencimiento, las registra en la herramienta contable, solicita aprobación al responsable y programa el recordatorio de pago.',
          flow: ['Factura por correo', 'Extracción de datos con IA', 'Registro contable', 'Aprobación y recordatorio'],
        },
        formValue: 'Automatización de procesos',
      },
      en: {
        title: 'Process automation',
        short: 'We connect applications and automate administrative and business operations.',
        seoTitle: 'Business process automation · RESUELVE INTELLECT',
        seoDescription:
          'Business automation: we connect your applications and automate invoices, onboarding, reports and admin tasks. Automation agency in Barcelona, Spain.',
        problem:
          'Copying data from one system to another, preparing reports by hand or chasing approvals by email are daily, error-prone tasks.',
        problemPoints: [
          'Human errors when re-typing information.',
          'Slow processes that depend on manual reminders.',
          'No traceability: nobody knows where each item stands.',
        ],
        how: [
          { t: 'We map the process', d: 'We document every current step, who does it, with which tool and how long it takes.' },
          { t: 'We design the ideal flow', d: 'We remove unnecessary steps and decide what to automate and what a person should review.' },
          { t: 'We connect the tools', d: 'We integrate your apps via APIs and platforms such as Make, adding AI where it adds value.' },
          { t: 'We monitor', d: 'Error alerts, logs for every run and metrics on time saved.' },
        ],
        benefits: [
          'Fewer errors and consistent data across systems.',
          'Processes that run on their own, any time.',
          'Full traceability for every operation.',
          'A team freed from mechanical tasks.',
        ],
        example: {
          title: 'Supplier invoices with no manual handling',
          text: 'Invoices arrive by email. The system extracts supplier, amount and due date, records them in the accounting tool, asks the manager for approval and schedules the payment reminder.',
          flow: ['Invoice by email', 'AI data extraction', 'Accounting entry', 'Approval and reminder'],
        },
        formValue: 'Process automation',
      },
    },
  },
  {
    id: 'customer',
    icon: 'chat',
    slug: { es: 'atencion-al-cliente-inteligente', en: 'intelligent-customer-service' },
    content: {
      es: {
        title: 'Atención al cliente inteligente',
        short: 'Sistemas de atención automatizada mediante WhatsApp, páginas web y otros canales.',
        seoTitle: 'Automatización de WhatsApp y atención al cliente con IA · RESUELVE INTELLECT',
        seoDescription:
          'Automatización de WhatsApp Business y chat web con inteligencia artificial: respuestas inmediatas, citas, reservas y derivación a tu equipo. Para clínicas, hoteles, restaurantes y comercios.',
        problem:
          'Tus clientes escriben por WhatsApp, por la web y por redes sociales a cualquier hora. Si no reciben respuesta rápida, se van a la competencia.',
        problemPoints: [
          'Mensajes sin respuesta fuera de horario.',
          'Equipo saturado con consultas repetitivas.',
          'Citas y reservas que se pierden por falta de seguimiento.',
        ],
        how: [
          { t: 'Unificamos canales', d: 'WhatsApp Business, chat web, correo y otros canales conectados a un mismo sistema.' },
          { t: 'Entrenamos al asistente', d: 'Con tus servicios, precios, horarios, políticas y tono de marca.' },
          { t: 'Conectamos tu operativa', d: 'Agenda, sistema de reservas o CRM para que el asistente resuelva, no solo informe.' },
          { t: 'Derivamos a personas', d: 'Casos sensibles o complejos pasan a tu equipo con todo el contexto de la conversación.' },
        ],
        benefits: [
          'Respuesta inmediata, de día y de noche.',
          'Más citas y reservas confirmadas.',
          'Experiencia de cliente consistente en todos los canales.',
          'Tu equipo atiende solo lo que requiere criterio humano.',
        ],
        example: {
          title: 'WhatsApp para una clínica dental',
          text: 'Un paciente escribe a las 22:00 para pedir cita. El asistente responde, propone huecos disponibles, registra la cita en la agenda, envía la confirmación y un recordatorio 24 horas antes.',
          flow: ['Mensaje de WhatsApp', 'Consulta de disponibilidad', 'Cita registrada', 'Confirmación y recordatorio'],
        },
        formValue: 'Atención al cliente inteligente',
      },
      en: {
        title: 'Intelligent customer service',
        short: 'Automated customer service across WhatsApp, websites and other channels.',
        seoTitle: 'WhatsApp automation and AI customer service · RESUELVE INTELLECT',
        seoDescription:
          'WhatsApp Business and website chat automation with AI: instant replies, appointments, bookings and hand-over to your team. For clinics, hotels, restaurants and retail.',
        problem:
          'Customers message you on WhatsApp, your website and social media at all hours. If they don\'t get a quick answer, they go to the competition.',
        problemPoints: [
          'Messages left unanswered after hours.',
          'A team overloaded with repetitive questions.',
          'Appointments and bookings lost for lack of follow-up.',
        ],
        how: [
          { t: 'We unify channels', d: 'WhatsApp Business, website chat, email and other channels connected to one system.' },
          { t: 'We train the assistant', d: 'With your services, prices, opening hours, policies and brand voice.' },
          { t: 'We connect your operations', d: 'Calendar, booking system or CRM so the assistant resolves, not just informs.' },
          { t: 'We hand over to people', d: 'Sensitive or complex cases go to your team with the full conversation context.' },
        ],
        benefits: [
          'Instant replies, day and night.',
          'More confirmed appointments and bookings.',
          'Consistent customer experience across channels.',
          'Your team only handles what needs human judgement.',
        ],
        example: {
          title: 'WhatsApp for a dental clinic',
          text: 'A patient messages at 10 pm to book an appointment. The assistant replies, offers available slots, records the appointment in the calendar, sends the confirmation and a reminder 24 hours before.',
          flow: ['WhatsApp message', 'Availability check', 'Appointment booked', 'Confirmation and reminder'],
        },
        formValue: 'Intelligent customer service',
      },
    },
  },
  {
    id: 'sales',
    icon: 'funnel',
    slug: { es: 'automatizacion-comercial', en: 'sales-automation' },
    content: {
      es: {
        title: 'Automatización comercial',
        short: 'Captación de clientes potenciales, clasificación de contactos, seguimiento y gestión mediante CRM.',
        seoTitle: 'Automatización comercial y CRM con IA · RESUELVE INTELLECT',
        seoDescription:
          'Automatización comercial con inteligencia artificial: captación y cualificación de leads, CRM, seguimiento automático y avisos al equipo de ventas.',
        problem:
          'Los contactos llegan por distintos canales, nadie los clasifica a tiempo y el seguimiento depende de la memoria de cada comercial.',
        problemPoints: [
          'Leads que esperan días a recibir respuesta.',
          'Tiempo comercial invertido en contactos poco cualificados.',
          'Presupuestos enviados sin seguimiento.',
        ],
        how: [
          { t: 'Centralizamos la captación', d: 'Formularios, WhatsApp, correo y campañas entran en un único CRM.' },
          { t: 'Cualificamos con IA', d: 'Cada contacto se clasifica por sector, tamaño, necesidad y urgencia.' },
          { t: 'Automatizamos el seguimiento', d: 'Secuencias de correo o WhatsApp personalizadas según la fase y el perfil.' },
          { t: 'Alertamos al equipo', d: 'El comercial recibe la oportunidad con contexto y prioridad en el momento adecuado.' },
        ],
        benefits: [
          'Respuesta en minutos a cada nuevo contacto.',
          'El equipo comercial se centra en las mejores oportunidades.',
          'Ningún presupuesto sin seguimiento.',
          'Visibilidad clara del embudo de ventas.',
        ],
        example: {
          title: 'Inmobiliaria con cientos de contactos al mes',
          text: 'Cada consulta de un portal inmobiliario se registra en el CRM, la IA identifica si es comprador, vendedor o inversor y su presupuesto, envía información relevante y asigna la visita al agente adecuado.',
          flow: ['Consulta del portal', 'Clasificación con IA', 'Ficha en CRM', 'Asignación al agente'],
        },
        formValue: 'Automatización comercial',
      },
      en: {
        title: 'Sales automation',
        short: 'Lead generation, contact qualification, follow-up and CRM management.',
        seoTitle: 'Sales automation and AI-powered CRM · RESUELVE INTELLECT',
        seoDescription:
          'Sales automation with artificial intelligence: lead capture and qualification, CRM, automatic follow-up and alerts to your sales team.',
        problem:
          "Leads arrive through different channels, nobody qualifies them in time and follow-up depends on each rep's memory.",
        problemPoints: [
          'Leads waiting days for a reply.',
          'Sales time spent on poorly qualified contacts.',
          'Quotes sent with no follow-up.',
        ],
        how: [
          { t: 'We centralise capture', d: 'Forms, WhatsApp, email and campaigns flow into a single CRM.' },
          { t: 'We qualify with AI', d: 'Every contact is classified by industry, size, need and urgency.' },
          { t: 'We automate follow-up', d: 'Personalised email or WhatsApp sequences based on stage and profile.' },
          { t: 'We alert the team', d: 'The rep gets the opportunity with context and priority at the right moment.' },
        ],
        benefits: [
          'Every new lead answered in minutes.',
          'Sales focuses on the best opportunities.',
          'No quote left without follow-up.',
          'Clear visibility of the sales funnel.',
        ],
        example: {
          title: 'Real estate agency with hundreds of leads per month',
          text: 'Every enquiry from a property portal is recorded in the CRM; AI identifies whether it is a buyer, seller or investor and their budget, sends relevant information and assigns the viewing to the right agent.',
          flow: ['Portal enquiry', 'AI classification', 'CRM record', 'Assigned to agent'],
        },
        formValue: 'Sales automation',
      },
    },
  },
  {
    id: 'systems',
    icon: 'grid',
    slug: { es: 'sistemas-de-gestion-inteligente', en: 'intelligent-management-systems' },
    content: {
      es: {
        title: 'Sistemas de gestión inteligente',
        short: 'Conectamos herramientas, bases de datos, formularios y aplicaciones para centralizar operaciones.',
        seoTitle: 'Sistemas de gestión inteligente e integración de herramientas · RESUELVE INTELLECT',
        seoDescription:
          'Centralizamos tus operaciones conectando herramientas, bases de datos, formularios y aplicaciones con paneles e inteligencia artificial.',
        problem:
          'La información de tu empresa vive en hojas de cálculo, correos y aplicaciones que no se comunican. Tomar decisiones exige reunir datos a mano.',
        problemPoints: [
          'Datos duplicados y versiones contradictorias.',
          'Informes que tardan días en prepararse.',
          'Dependencia de hojas de cálculo frágiles.',
        ],
        how: [
          { t: 'Auditamos tus herramientas', d: 'Identificamos qué datos existen, dónde están y quién los usa.' },
          { t: 'Diseñamos una fuente única', d: 'Una base de datos central conectada a todas tus aplicaciones.' },
          { t: 'Creamos interfaces útiles', d: 'Formularios, paneles y vistas adaptadas a cada rol del equipo.' },
          { t: 'Añadimos inteligencia', d: 'Resúmenes automáticos, alertas y consultas en lenguaje natural sobre tus datos.' },
        ],
        benefits: [
          'Una sola fuente de verdad para toda la empresa.',
          'Informes actualizados en tiempo real.',
          'Decisiones más rápidas y mejor informadas.',
          'Escalabilidad sin multiplicar el caos.',
        ],
        example: {
          title: 'Residencia con gestión centralizada',
          text: 'Incidencias, turnos, comunicaciones con familias y pedidos se registran desde formularios sencillos en una base central. La dirección consulta un panel actualizado y recibe un resumen diario generado automáticamente.',
          flow: ['Formularios del equipo', 'Base de datos central', 'Panel de dirección', 'Resumen diario con IA'],
        },
        formValue: 'Sistemas de gestión inteligente',
      },
      en: {
        title: 'Intelligent management systems',
        short: 'We connect tools, databases, forms and applications to centralise operations.',
        seoTitle: 'Intelligent management systems and tool integration · RESUELVE INTELLECT',
        seoDescription:
          'We centralise your operations by connecting tools, databases, forms and applications with dashboards and artificial intelligence.',
        problem:
          "Your company's information lives in spreadsheets, emails and apps that don't talk to each other. Making decisions means gathering data by hand.",
        problemPoints: [
          'Duplicate data and conflicting versions.',
          'Reports that take days to prepare.',
          'Dependence on fragile spreadsheets.',
        ],
        how: [
          { t: 'We audit your tools', d: 'We identify which data exists, where it lives and who uses it.' },
          { t: 'We design a single source', d: 'A central database connected to all your applications.' },
          { t: 'We build useful interfaces', d: 'Forms, dashboards and views tailored to each team role.' },
          { t: 'We add intelligence', d: 'Automatic summaries, alerts and natural-language queries on your data.' },
        ],
        benefits: [
          'A single source of truth for the whole company.',
          'Reports updated in real time.',
          'Faster, better-informed decisions.',
          'Scale without multiplying chaos.',
        ],
        example: {
          title: 'Care home with centralised management',
          text: 'Incidents, shifts, family communications and orders are recorded through simple forms into a central base. Management checks an up-to-date dashboard and receives an automatically generated daily summary.',
          flow: ['Team forms', 'Central database', 'Management dashboard', 'Daily AI summary'],
        },
        formValue: 'Intelligent management systems',
      },
    },
  },
  {
    id: 'consulting',
    icon: 'compass',
    slug: { es: 'consultoria-inteligencia-artificial', en: 'ai-consulting' },
    content: {
      es: {
        title: 'Consultoría e implementación de IA',
        short: 'Analizamos las necesidades de cada empresa y diseñamos soluciones adaptadas a sus objetivos.',
        seoTitle: 'Consultoría de inteligencia artificial para empresas · RESUELVE INTELLECT',
        seoDescription:
          'Consultoría de inteligencia artificial para empresas en España y a nivel internacional: diagnóstico, hoja de ruta, implementación y formación del equipo.',
        problem:
          'Sabes que la inteligencia artificial puede ayudar a tu empresa, pero no sabes por dónde empezar, qué herramientas elegir ni cómo medir el retorno.',
        problemPoints: [
          'Exceso de herramientas y promesas difíciles de evaluar.',
          'Miedo a invertir en tecnología que no se va a usar.',
          'Dudas sobre privacidad, seguridad y cumplimiento normativo.',
        ],
        how: [
          { t: 'Diagnóstico', d: 'Entrevistas y análisis de procesos para detectar dónde la IA aporta valor real.' },
          { t: 'Hoja de ruta', d: 'Priorizamos iniciativas por impacto, coste y complejidad, con fases claras.' },
          { t: 'Implementación', d: 'Desarrollamos e integramos las soluciones, o acompañamos a tu equipo técnico.' },
          { t: 'Formación y adopción', d: 'Formamos a tu equipo y establecemos buenas prácticas de uso de IA.' },
        ],
        benefits: [
          'Decisiones tecnológicas con criterio y sin humo.',
          'Inversión priorizada por impacto.',
          'Uso responsable de la IA y de los datos.',
          'Equipo preparado para sacarle partido.',
        ],
        example: {
          title: 'Hoja de ruta de IA para una empresa de servicios',
          text: 'Tras analizar los procesos de atención, operaciones y administración, se identifican las iniciativas de mayor impacto, se implementa primero la de retorno más rápido y se planifican las siguientes fases.',
          flow: ['Análisis de procesos', 'Mapa de oportunidades', 'Primer piloto', 'Plan por fases'],
        },
        formValue: 'Consultoría e implementación de IA',
      },
      en: {
        title: 'AI consulting & implementation',
        short: "We analyse each company's needs and design solutions tailored to its goals.",
        seoTitle: 'Artificial intelligence consulting for business · RESUELVE INTELLECT',
        seoDescription:
          'Artificial intelligence consulting for companies in Spain and internationally: assessment, roadmap, implementation and team training.',
        problem:
          "You know AI could help your business, but you don't know where to start, which tools to pick or how to measure the return.",
        problemPoints: [
          'Too many tools and promises that are hard to assess.',
          "Fear of investing in technology that won't be used.",
          'Questions about privacy, security and compliance.',
        ],
        how: [
          { t: 'Assessment', d: 'Interviews and process analysis to find where AI adds real value.' },
          { t: 'Roadmap', d: 'We prioritise initiatives by impact, cost and complexity, in clear phases.' },
          { t: 'Implementation', d: 'We build and integrate the solutions, or support your technical team.' },
          { t: 'Training and adoption', d: 'We train your team and establish good AI usage practices.' },
        ],
        benefits: [
          'Technology decisions based on judgement, not hype.',
          'Investment prioritised by impact.',
          'Responsible use of AI and data.',
          'A team ready to make the most of it.',
        ],
        example: {
          title: 'AI roadmap for a service company',
          text: 'After analysing customer service, operations and admin processes, the highest-impact initiatives are identified, the fastest-return one is implemented first and the next phases are planned.',
          flow: ['Process analysis', 'Opportunity map', 'First pilot', 'Phased plan'],
        },
        formValue: 'AI consulting & implementation',
      },
    },
  },
];

export const getService = (id: string) => services.find((s) => s.id === id);
