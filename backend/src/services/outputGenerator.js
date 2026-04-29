const fs = require('fs');
const path = require('path');
const { Document, Paragraph, TextRun, HeadingLevel, Packer } = require('docx');
const { PDFDocument, StandardFonts, PageSizes } = require('pdf-lib');
const { PATHS } = require('../utils/storage');

function docxPath(jobId) {
  return path.join(PATHS.outputs, `${jobId}.docx`);
}

function pdfPath(jobId) {
  return path.join(PATHS.outputs, `${jobId}.pdf`);
}

async function generateDocx(job) {
  const outPath = docxPath(job.id);
  if (fs.existsSync(outPath)) return outPath;

  const paragraphs = [
    new Paragraph({ text: job.originalName, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: '' }),
  ];

  const lines = (job.text || '').split('\n').filter(Boolean);
  for (const line of lines) {
    paragraphs.push(new Paragraph({ children: [new TextRun(line.trim())] }));
  }

  const doc = new Document({ sections: [{ children: paragraphs }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log(`docx ok [${job.id}]`);
  return outPath;
}

async function generatePdf(job) {
  const outPath = pdfPath(job.id);
  if (fs.existsSync(outPath)) return outPath;

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  const titleSize = 16;
  const textSize = 12;
  const lineHeight = textSize * 1.5;

  let page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const maxWidth = width - margin * 2;
  let y = height - margin;

  function ensureLine() {
    if (y < margin + lineHeight) {
      page = pdfDoc.addPage(PageSizes.A4);
      y = height - margin;
    }
  }

  page.drawText(job.originalName, { x: margin, y, size: titleSize, font: fontBold });
  y -= titleSize + 20;

  const words = (job.text || '').trim().split(/\s+/);
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (fontRegular.widthOfTextAtSize(candidate, textSize) > maxWidth && line) {
      ensureLine();
      page.drawText(line, { x: margin, y, size: textSize, font: fontRegular });
      y -= lineHeight;
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) {
    ensureLine();
    page.drawText(line, { x: margin, y, size: textSize, font: fontRegular });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`pdf ok [${job.id}]`);
  return outPath;
}

module.exports = { generateDocx, generatePdf, docxPath, pdfPath };
