import type { ResumeData } from './resumeTypes'

/**
 * Generates a Word-compatible HTML document (.doc) from ResumeData.
 * Opens and edits correctly in Microsoft Word, LibreOffice, and Google Docs.
 */
export function exportResumeAsDoc(data: ResumeData) {
  const allSkills = [
    ...data.technicalSkills,
    ...data.tools,
    ...data.softSkills,
  ].filter(Boolean)

  const experienceHtml = data.experience.map(exp => `
    <div style="margin-bottom:14px;">
      <table width="100%" style="border:none;border-collapse:collapse;"><tr>
        <td style="border:none;padding:0;"><b style="font-size:11pt;">${exp.title}</b> — ${exp.company}</td>
        <td style="border:none;padding:0;text-align:right;color:#555;font-size:10pt;">${exp.start}${exp.end || exp.current ? ` – ${exp.current ? 'Present' : exp.end}` : ''}</td>
      </tr></table>
      <ul style="margin:4px 0 0 0;padding-left:18px;">
        ${exp.responsibilities
          .split('\n')
          .map(r => r.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean)
          .map(r => `<li style="font-size:10.5pt;margin-bottom:3px;">${r}</li>`)
          .join('')}
      </ul>
    </div>`).join('')

  const educationHtml = data.education.map(edu => `
    <div style="margin-bottom:10px;">
      <table width="100%" style="border:none;border-collapse:collapse;"><tr>
        <td style="border:none;padding:0;"><b style="font-size:11pt;">${edu.institution}</b></td>
        <td style="border:none;padding:0;text-align:right;color:#555;font-size:10pt;">${edu.startYear}${edu.endYear ? ` – ${edu.endYear}` : ''}</td>
      </tr></table>
      <p style="margin:2px 0;font-size:10.5pt;color:#333;">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}${edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</p>
    </div>`).join('')

  const projectsHtml = data.projects.length > 0 ? `
    <h2 style="${sectionHeadingStyle}">Projects</h2>
    ${data.projects.map(p => `
      <div style="margin-bottom:12px;">
        <b style="font-size:11pt;">${p.name}</b>${p.tech.length ? ` <span style="color:#555;font-size:10pt;">(${p.tech.join(', ')})</span>` : ''}
        ${p.liveUrl ? `<span style="font-size:9.5pt;color:#555;"> · <a href="${p.liveUrl}">${p.liveUrl}</a></span>` : ''}
        ${p.githubUrl ? `<span style="font-size:9.5pt;color:#555;"> · <a href="${p.githubUrl}">GitHub</a></span>` : ''}
        <p style="margin:3px 0;font-size:10.5pt;">${p.description}</p>
      </div>`).join('')}` : ''

  const linksHtml = [
    data.email && `<a href="mailto:${data.email}" style="color:#1a56db;">${data.email}</a>`,
    data.phone,
    data.location,
    data.linkedin && `<a href="${data.linkedin}" style="color:#1a56db;">LinkedIn</a>`,
    data.github && `<a href="${data.github}" style="color:#1a56db;">GitHub</a>`,
    data.portfolio && `<a href="${data.portfolio}" style="color:#1a56db;">Portfolio</a>`,
  ].filter(Boolean).join(' &nbsp;|&nbsp; ')

  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${data.fullName || 'Resume'}</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1a1a1a; margin: 0; padding: 0; }
    h1 { font-size: 20pt; margin: 0 0 4px 0; color: #111; }
    h2 { font-size: 11pt; text-transform: uppercase; letter-spacing: 1.2px; color: #1a56db;
         border-bottom: 1.5px solid #1a56db; padding-bottom: 3px; margin: 18px 0 8px 0; }
    p { margin: 0 0 6px 0; }
    ul { margin: 0; padding-left: 16px; }
    li { margin-bottom: 3px; }
    a { color: #1a56db; text-decoration: none; }
    .page { max-width: 720px; margin: 0 auto; padding: 36px 40px; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <h1>${data.fullName || ''}</h1>
    <p style="font-size:10pt;color:#444;margin-bottom:14px;">${linksHtml}</p>

    <!-- Summary -->
    ${data.summary ? `
    <h2 style="${sectionHeadingStyle}">Professional Summary</h2>
    <p style="font-size:10.5pt;line-height:1.5;">${data.summary}</p>` : ''}

    <!-- Skills -->
    ${allSkills.length ? `
    <h2 style="${sectionHeadingStyle}">Skills</h2>
    <p style="font-size:10.5pt;">${allSkills.join(' &nbsp;·&nbsp; ')}</p>` : ''}

    <!-- Experience -->
    ${data.experience.length ? `
    <h2 style="${sectionHeadingStyle}">Experience</h2>
    ${experienceHtml}` : ''}

    <!-- Projects -->
    ${projectsHtml}

    <!-- Education -->
    ${data.education.length ? `
    <h2 style="${sectionHeadingStyle}">Education</h2>
    ${educationHtml}` : ''}
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'application/msword' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(data.fullName || 'resume').replace(/\s+/g, '-')}-tailored.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const sectionHeadingStyle = `font-size:11pt;text-transform:uppercase;letter-spacing:1.2px;
  color:#1a56db;border-bottom:1.5px solid #1a56db;padding-bottom:3px;margin:18px 0 8px 0;`
