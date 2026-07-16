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
        Title: "SOLICITUD TARJETA + METRO",
        Author: "Metro de Málaga",
        Subject: "Solicitud Tarjeta Mas Metro",
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
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const minY = Math.max(doc.y + 54, 545);

  doc.y = minY;
  doc
    .fillColor(BRAND.text)
    .font("Helvetica")
    .fontSize(11)
    .text(formatSpanishDate(createdAt), x, doc.y, {
      width,
      align: "center",
    });

  doc.moveDown(1.25);
  doc
    .fillColor(BRAND.burgundy)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("FIRMA", x, doc.y, { width, align: "center", characterSpacing: 1 });

  const signatureTop = doc.y + 10;
  const signatureBoxWidth = 225;
  const signatureBoxHeight = 105;
  const signatureBoxX = x + (width - signatureBoxWidth) / 2;

  doc
    .roundedRect(signatureBoxX, signatureTop, signatureBoxWidth, signatureBoxHeight, 7)
    .lineWidth(0.8)
    .strokeColor(BRAND.border)
    .stroke();

  if (signature) {
    doc.image(signature, signatureBoxX + 12, signatureTop + 10, {
      fit: [signatureBoxWidth - 24, signatureBoxHeight - 20],
      align: "center",
      valign: "center",
    });
  } else {
    doc
      .fillColor(BRAND.muted)
      .font("Helvetica-Oblique")
      .fontSize(8.5)
      .text("Firma no facilitada", signatureBoxX, signatureTop + 47, {
        width: signatureBoxWidth,
        align: "center",
      });
  }

  doc.y = signatureTop + signatureBoxHeight + 10;
}

function drawFooter(doc) {
  const x = doc.page.margins.left;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.page.height - doc.page.margins.bottom - 12;

  doc
    .moveTo(x, y - 8)
    .lineTo(x + width, y - 8)
    .lineWidth(0.5)
    .strokeColor("#DED0CB")
    .stroke();

  doc
    .fillColor(BRAND.muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text("Metro de Málaga - Solicitud generada electrónicamente", x, y, {
      width,
      align: "center",
      lineBreak: false,
    });
}

function getApplicantData(payload) {
  return {
    name: firstValue(payload, [
      "NombreCompleto",
      "NombreSolicitante",
      "Solicitante",
      "NombreApellidos",
      "NombreYApellidos",
      "Nombre",
    ]),
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
  const data = {
    name: firstValue(payload, [
      "NombreCompletoRepresentante",
      "NombreRepresentante",
      "Representante",
      "NombreApellidosRepresentante",
    ]),
    document: firstValue(payload, [
      "DNIRepresentante",
      "NIFRepresentante",
      "NIERepresentante",
      "DocumentoRepresentante",
      "DniNifNieRepresentante",
    ]),
    phone: firstValue(payload, [
      "TelefonoRepresentante",
      "MovilRepresentante",
    ]),
    email: firstValue(payload, [
      "EmailRepresentante",
      "CorreoRepresentante",
      "CorreoElectrónicoRepresentante",
    ]),
  };

  return {
    ...data,
    hasData: Object.values(data).some((value) => String(value || "").trim() !== ""),
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
  const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return `En Málaga a ${weekdays[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
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
