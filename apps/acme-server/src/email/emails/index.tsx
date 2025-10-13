import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import type { EmailTemplate } from '../email.types'

export async function renderEmailTemplate(templateName: EmailTemplate['name'], props: EmailTemplate['args']) {
  const filePath = path.resolve(__dirname, `./${templateName}.tsx`)
  const imported = await import(filePath)
  const Component = imported.default

  if (!Component) throw new Error(`No default export in ${templateName}.tsx`)

  return renderToStaticMarkup(<Component {...props} />)
}
