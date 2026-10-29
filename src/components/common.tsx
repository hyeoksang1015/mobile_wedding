import { useEffect, useState, type ReactNode } from 'react'
import { useReveal } from '../lib/ui'

export function Icon({ name, fill }: { name: string; fill?: boolean }) {
  return (
    <span className={fill ? 'icon fill' : 'icon'} aria-hidden="true">
      {name}
    </span>
  )
}

export function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <Icon name="local_florist" />
    </div>
  )
}

export function Section(props: {
  id: string
  eyebrow?: string
  title?: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>()
  return (
    <section
      id={props.id}
      ref={ref}
      className="section reveal-target"
      aria-labelledby={props.title ? `${props.id}-title` : undefined}
    >
      {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
      {props.title && (
        <>
          <h2 id={`${props.id}-title`} className="section-title">
            {props.title}
          </h2>
          <Divider />
        </>
      )}
      {props.children}
    </section>
  )
}

export function Toast() {
  const [message, setMessage] = useState('')
  useEffect(() => {
    let timer: number
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail)
      clearTimeout(timer)
      timer = window.setTimeout(() => setMessage(''), 2200)
    }
    window.addEventListener('app-toast', onToast)
    return () => window.removeEventListener('app-toast', onToast)
  }, [])
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {message && (
        <div className="toast">
          <Icon name="check_circle" fill />
          {message}
        </div>
      )}
    </div>
  )
}
