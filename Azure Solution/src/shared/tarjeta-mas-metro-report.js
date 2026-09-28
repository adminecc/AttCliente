const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");


const BRAND = {
  red: "#DC241F",
  burgundy: "#6B130C",
  soft: "#F6EEEC",
  border: "#D9C4BE",
  text: "#292929",
  muted: "#6B6B6B",
};

async function generarInformeTarjetaMasMetro(payload, options = {}) {
  const createdAt = options.createdAt ? new Date(options.createdAt) : new Date();
  const token = sanitizeFilePart(options.token || "solicitud");
  const signature = resolveSignature(payload, options.files || []);
  const logoPath = resolveLogoPath(options.logoPath);

  const pdfBuffer = await buildPdf({
    payload,
    createdAt,
    signature,
    logoPath,
  });

  return {
    fieldName: "InformeTarjetaMasMetro",
    fileName: `Solicitud_Tarjeta_Mas_Metro_${token}.pdf`,
    contentType: "application/pdf",
    sizeBytes: pdfBuffer.length,
    content: pdfBuffer,
  };
}

function buildPdf({ payload, createdAt, signature, logoPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 42, right: 48, bottom: 46, left: 48 },
      info: {
        Title: "SOLICITUD EXPEDICIÓN TARJETA + METRO",
        Author: "Metro de Málaga",
        Subject: "Solicitud Tarjeta Más Metro",
        Creator: "Azure Functions",
      },
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      drawHeader(doc, logoPath);

      const applicant = getApplicantData(payload);
      const representative = getRepresentativeData(payload);

      drawSectionTitle(doc, "DATOS DE LA PERSONA SOLICITANTE");
      drawDataCard(doc, [
        ["Solicitante", applicant.name],
        ["DNI / NIF / NIE", applicant.document],
        ["Telefono de contacto", applicant.phone],
        ["Email", applicant.email],
      ]);

      if (representative.hasData) {
        doc.moveDown(1.1);
        drawSectionTitle(doc, "DATOS DE LA PERSONA REPRESENTANTE");
        drawDataCard(doc, [
          ["Representante", representative.name],
          ["DNI / NIF / NIE", representative.document],
          ["Telefono de contacto", representative.phone],
          ["Email", representative.email],
        ]);
      }

      drawSignatureBlock(doc, createdAt, signature);
      drawFooter(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc, logoPath) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const width = right - left;
  const top = 38;
  const headerHeight = 92;

  doc.save();
  doc.roundedRect(left, top, width, headerHeight, 12).fill(BRAND.burgundy);

  if (logoPath) {
    doc.image(logoPath, left + 18, top + 18, {
      fit: [145, 54],
      align: "left",
      valign: "center",
    });
  } else {
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(17)
      .text("METRO", left + 20, top + 25, { width: 120 });
    doc
      .fillColor("#FFFFFF")
      .font("Helvetica")
      .fontSize(8)
      .text("MALAGA", left + 21, top + 51, { characterSpacing: 2.3 });
  }

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(19)
    .text("SOLICITUD TARJETA + METRO", left + 178, top + 32, {
      width: width - 198,
      align: "right",
      characterSpacing: 0.3,
    });

  doc.restore();
  doc.y = top + headerHeight + 28;
}

function drawSectionTitle(doc, title) {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .fillColor(BRAND.burgundy)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, x, doc.y, { width, characterSpacing: 0.7 });

  const lineY = doc.y + 5;
  doc
    .moveTo(x, lineY)
    .lineTo(x + width, lineY)
    .lineWidth(1.3)
    .strokeColor(BRAND.red)
    .stroke();
  doc.y = lineY + 14;
}

function drawDataCard(doc, rows) {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = 162;
  const rowHeight = 39;
  const height = rows.length * rowHeight;
  const y = doc.y;

  doc.save();
  doc.roundedRect(x, y, width, height, 9).fillAndStroke("#FFFFFF", BRAND.border);

  rows.forEach(([label, value], index) => {
    const rowY = y + index * rowHeight;

    if (index > 0) {
      doc
        .moveTo(x, rowY)
        .lineTo(x + width, rowY)
        .lineWidth(0.6)
        .strokeColor("#E9DEDA")
        .stroke();
    }

    doc.rect(x, rowY, labelWidth, rowHeight).fill(BRAND.soft);
    doc
      .fillColor(BRAND.burgundy)
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(label, x + 13, rowY + 13, {
        width: labelWidth - 24,
        lineBreak: false,
      });

    doc
      .fillColor(BRAND.text)
      .font("Helvetica")
      .fontSize(10.5)
      .text(displayValue(value), x + labelWidth + 15, rowY + 12, {
        width: width - labelWidth - 28,
        height: rowHeight - 12,
        ellipsis: true,
      });
  });

  doc.restore();
  doc.y = y + height;
}

function drawSignatureBlock(doc, createdAt, signature) {
  const x = doc.page.margins.left;
  const width =
    doc.page.width -
    doc.page.margins.left -
    doc.page.margins.right;

  /*
   * La fecha ya NO tiene una posición fija.
   *
   * - Sin tutor: conservamos aproximadamente la posición actual.
   * - Con tutor: se desplaza automáticamente hacia abajo
   *   dejando 35 puntos después del último bloque de datos.
   */
  const dateY = Math.max(doc.y + 35, 515);

  doc
    .fillColor(BRAND.text)
    .font("Helvetica")
    .fontSize(11)
    .text(formatSpanishDate(createdAt), x, dateY, {
      width,
      align: "center",
    });

  if (signature) {
    const signatureWidth = 145;
    const signatureHeight = 65;

    const signatureX =
      x + (width - signatureWidth) / 2;

    doc.image(signature, signatureX, dateY + 40, {
      fit: [signatureWidth, signatureHeight],
      align: "center",
      valign: "center",
    });
  }

  // Dejamos actualizado doc.y por si posteriormente
  // se añade cualquier otro elemento al documento.
  doc.y = dateY + 115;
}

function drawFooter(doc) {
  const x = 34;
  const width = doc.page.width - 68;

  // Algo más arriba para permitir una fuente mayor
  const footerY = doc.page.height - 132;

  const privacyTitle =
    "INFORMACIÓN SOBRE TRATAMIENTO DE DATOS PERSONALES, POLÍTICA DE PRIVACIDAD";

  const privacyText =
    "Responsable del tratamiento: METRO DE MÁLAGA, S.A., con domicilio en Camino de Santa Inés, s/n, 29590 – Málaga, NIF A-92592856 (\"MM\"). " +
    "Delegado de Protección de Datos: dpd@metromalaga.es. " +
    "Finalidad del tratamiento: tramitar y gestionar adecuadamente su solicitud de emisión de título de transporte personalizado. " +
    "Base de legitimación: consentimiento. El consentimiento podrá ser retirado en cualquier momento, si bien, en caso de ser retirado, MM no podrá seguir tramitando su solicitud. " +
    "Plazo de conservación: plazo necesario para gestionar el uso del título emitido y el necesario para el cumplimiento de obligaciones legales. " +
    "Comunicación: MM podrá comunicar los datos personales a encargados del tratamiento y/o a organismos públicos competentes. " +
    "No se prevén transferencias internacionales de datos. " +
    "Derechos: podrá ejercer sus derechos (acceso, rectificación o supresión, limitación, oposición, portabilidad y a no ser objeto de decisiones individuales automatizadas) " +
    "a través del correo electrónico dpd@metromalaga.es o mediante correo postal a la atención del Dpto. de Asesoría Jurídica, a Camino de Santa Inés, s/n, 29590, Málaga. " +
    "Puede consultar información adicional sobre protección de datos en nuestra página web www.metromalaga.es o directamente al personal de MM presente en nuestras instalaciones.";

  doc.save();

  doc
    .fillColor("#3F3F3F")
    .font("Helvetica-Bold")
    .fontSize(6.2)
    .text(privacyTitle, x, footerY, {
      width,
      align: "left",
      underline: true,
      lineBreak: false,
    });

  doc
    .fillColor("#555555")
    .font("Helvetica")
    .fontSize(5.6)
    .text(privacyText, x, footerY + 10, {
      width,
      align: "justify",
      lineGap: 0.6,
    });

  doc.restore();
}

function getApplicantData(payload) {
  const name =
    firstValue(payload, [
      "NombreCompleto",
      "NombreSolicitante",
      "Solicitante",
      "NombreApellidos",
      "NombreYApellidos",
    ]) ||
    joinNonEmpty([
      firstValue(payload, [
        "NombreCliente",
        "Nombre",
      ]),
      firstValue(payload, [
        "ApellidoCliente1",
        "PrimerApellido",
        "Apellido1",
      ]),
      firstValue(payload, [
        "ApellidoCliente2",
        "SegundoApellido",
        "Apellido2",
      ]),
      // Por si el frontend manda ambos apellidos juntos
      !firstValue(payload, [
        "ApellidoCliente1",
        "PrimerApellido",
        "Apellido1",
      ])
        ? firstValue(payload, ["Apellidos"])
        : "",
    ]);

  return {
    name,

    document: firstValue(payload, [
      "DNICliente",
      "DniCliente",
      "dniCliente",
      "DNI_NIF_NIE",
      "DniNifNie",
      "DocumentoIdentidad",
      "NumeroDocumento",
      "DNI",
      "NIF",
      "NIE",
    ]),

    phone: firstValue(payload, [
      "TelefonoContacto",
      "TelefonoCliente1",
      "Telefono",
      "Movil",
      "TelefonoSolicitante",
    ]),

    email: firstValue(payload, [
      "CorreoElectronico",
      "EmailCliente",
      "Email",
      "Correo",
    ]),
  };
}

function getRepresentativeData(payload) {
  const name =
    firstValue(payload, [
      "NombreCompletoTutor",
      "NombreCompletoRepresentante",
      "NombreApellidosTutor",
      "NombreApellidosRepresentante",
    ]) ||
    joinNonEmpty([
      firstValue(payload, [
        "NombreTutor",
        "NombreRepresentante",
        "Representante",
        "NombreRep",
      ]),
      firstValue(payload, [
        "ApellidoTutor1",
        "ApellidoRepresentante1",
        "ApellidoRep1",
        "PrimerApellidoTutor",
      ]),
      firstValue(payload, [
        "ApellidoTutor2",
        "ApellidoRepresentante2",
        "ApellidoRep2",
        "SegundoApellidoTutor",
      ]),
      !firstValue(payload, [
        "ApellidoTutor1",
        "ApellidoRepresentante1",
        "ApellidoRep1",
        "PrimerApellidoTutor",
      ])
        ? firstValue(payload, [
            "ApellidosTutor",
            "ApellidosRepresentante",
          ])
        : "",
    ]);

  const data = {
    name,

    document: firstValue(payload, [
      "DNITutor",
      "DniTutor",
      "DNIRepresentante",
      "NIFRepresentante",
      "NIERepresentante",
      "DocumentoRepresentante",
      "DniNifNieRepresentante",
      "DNIRep",
    ]),

    phone: firstValue(payload, [
      "TelefonoTutor",
      "TelefonoRepresentante",
      "TelefonoRep1",
      "MovilRepresentante",
    ]),

    email: firstValue(payload, [
      "EmailTutor",
      "CorreoTutor",
      "EmailRep",
      "EmailRepresentante",
      "CorreoRepresentante",
      "CorreoElectrónicoRepresentante",
    ]),
  };

  return {
    ...data,
    hasData: Object.values(data).some(
      (value) => String(value || "").trim() !== ""
    ),
  };
}

function resolveSignature(payload, files) {
  const signatureFile = files.find((file) => {
    const field = normalize(file.fieldName);
    const name = normalize(file.fileName);
    return (field.includes("firma") || field.includes("signature") || name.includes("firma"))
      && String(file.contentType || "").toLowerCase().startsWith("image/")
      && Buffer.isBuffer(file.content);
  });

  if (signatureFile) return signatureFile.content;

  const raw = firstValue(payload, [
    "FirmaBase64",
    "Firma",
    "firmaBase64",
    "firma",
    "SignatureBase64",
    "signature",
  ]);

  return decodeBase64Image(raw);
}

function decodeBase64Image(value) {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(trimmed);
  const base64 = match ? match[2] : trimmed;

  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) return null;

  try {
    const buffer = Buffer.from(base64.replace(/\s/g, ""), "base64");
    return buffer.length > 0 ? buffer : null;
  } catch {
    return null;
  }
}

function resolveLogoPath(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.METRO_MALAGA_LOGO_PATH,
    path.join(process.cwd(), "src", "assets", "logo-metro-malaga.png"),
    path.join(process.cwd(), "assets", "logo-metro-malaga.png"),
    path.join(__dirname, "..", "assets", "logo-metro-malaga.png"),
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) || null;
}

function formatSpanishDate(date) {
  const weekdays = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return `En Málaga a ${weekdays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function joinNonEmpty(values) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");
}

function firstValue(source, keys) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function displayValue(value) {
  const text = String(value || "").trim();
  return text || "No informado";
}

function sanitizeFilePart(value) {
  return String(value || "solicitud")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "solicitud";
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

module.exports = {
  generarInformeTarjetaMasMetro,
  formatSpanishDate,
};
