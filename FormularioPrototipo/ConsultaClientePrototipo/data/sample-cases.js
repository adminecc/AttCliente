window.SAMPLE_CASES = [
  {
    caseId: 'ATT-2026-41001',
    type: 'Reclamaciones y quejas',
    status: 'En trámite',
    submittedAt: '2026-06-03',
    updatedAt: '2026-06-18',
    personalData: {
      email: 'reclamacion.demo@correo.test',
      phone: '612345001'
    },
    resolutionSummary: 'La reclamación está siendo revisada por el área responsable.',
    nextStep: 'Recibirá una notificación cuando se incorpore una respuesta al expediente.',
    attachments: [
      {
        id: 'acuse-reclamacion',
        name: 'Acuse de recibo de reclamación',
        url: 'attachments/acuse-reclamacion.pdf',
        mimeType: 'application/pdf',
        size: '5 KB'
      },
      {
        id: 'foto-incidencia',
        name: 'Fotografía aportada',
        url: 'attachments/foto-incidencia.svg',
        mimeType: 'image/svg+xml',
        size: '6 KB'
      }
    ]
  },
  {
    caseId: 'ATT-2026-41002',
    type: 'Consulta de Información',
    status: 'Resuelta gestionada',
    submittedAt: '2026-05-28',
    updatedAt: '2026-06-02',
    personalData: {
      email: 'consulta.demo@correo.test',
      phone: '612345002'
    },
    resolutionSummary: 'La consulta fue atendida y se facilitó la información solicitada.',
    nextStep: 'No es necesario realizar ninguna acción adicional.',
    attachments: [
      {
        id: 'respuesta-consulta',
        name: 'Respuesta a consulta de información',
        url: 'attachments/respuesta-consulta.html',
        mimeType: 'text/html',
        size: '4 KB'
      }
    ]
  },
  {
    caseId: 'ATT-2026-41003',
    type: 'Sugerencias',
    status: 'Resuelta aceptada',
    submittedAt: '2026-05-19',
    updatedAt: '2026-06-11',
    personalData: {
      email: 'sugerencia.demo@correo.test',
      phone: '612345003'
    },
    resolutionSummary: 'La sugerencia ha sido aceptada para su valoración operativa.',
    nextStep: 'El área responsable estudiará su incorporación a futuras mejoras del servicio.',
    attachments: [
      {
        id: 'valoracion-sugerencia',
        name: 'Valoración inicial de la sugerencia',
        url: 'attachments/valoracion-sugerencia.txt',
        mimeType: 'text/plain',
        size: '3 KB'
      },
      {
        id: 'anexo-datos',
        name: 'Anexo de datos de valoración',
        url: 'attachments/resumen-datos-tarjeta.csv',
        mimeType: 'text/csv',
        size: '1 KB'
      }
    ]
  },
  {
    caseId: 'ATT-2026-41004',
    type: 'Agradecimientos y felicitaciones',
    status: 'Resuelta gestionada',
    submittedAt: '2026-06-07',
    updatedAt: '2026-06-09',
    personalData: {
      email: 'agradecimiento.demo@correo.test',
      phone: '612345004'
    },
    resolutionSummary: 'El agradecimiento fue registrado y trasladado al equipo correspondiente.',
    nextStep: 'El expediente queda cerrado sin documentación adicional.',
    attachments: []
  },
  {
    caseId: 'ATT-2026-41005',
    type: 'Objetos perdidos',
    status: 'Resuelta denegada',
    submittedAt: '2026-05-30',
    updatedAt: '2026-06-14',
    personalData: {
      email: 'objetos.demo@correo.test',
      phone: '612345005'
    },
    resolutionSummary: 'No se ha localizado un objeto coincidente con los datos aportados.',
    nextStep: 'Puede presentar una nueva solicitud si dispone de información adicional.',
    attachments: [
      {
        id: 'informe-busqueda',
        name: 'Informe de búsqueda de objeto perdido',
        url: 'attachments/informe-busqueda-objeto.txt',
        mimeType: 'text/plain',
        size: '3 KB'
      }
    ]
  },
  {
    caseId: 'ATT-2026-41006',
    type: 'Solicitud de tarjeta +Metro',
    status: 'Resuelta aceptada',
    submittedAt: '2026-06-01',
    updatedAt: '2026-06-17',
    personalData: {
      email: 'tarjeta.demo@correo.test',
      phone: '612345006'
    },
    resolutionSummary: 'La solicitud de tarjeta ha sido aceptada.',
    nextStep: 'Acuda a la Oficina de Atención al Cliente con cita previa y documentación identificativa.',
    attachments: [
      {
        id: 'cita-tarjeta',
        name: 'Indicaciones para la recogida de tarjeta',
        url: 'attachments/indicaciones-tarjeta-masmetro.txt',
        mimeType: 'text/plain',
        size: '2 KB'
      },
      {
        id: 'resumen-datos',
        name: 'Resumen de datos registrados',
        url: 'attachments/resumen-datos-tarjeta.csv',
        mimeType: 'text/csv',
        size: '1 KB'
      }
    ]
  }
];
