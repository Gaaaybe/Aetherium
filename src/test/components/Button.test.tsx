import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import userEvent from '@testing-library/user-event'
import { Button } from '../../shared/ui/Button'

describe('Button Component', () => {
  it('deve renderizar com texto correto', () => {
    render(<Button>Clique Aqui</Button>)
    expect(screen.getByText('Clique Aqui')).toBeInTheDocument()
  })

  it('deve chamar onClick quando clicado', async () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    
    render(<Button onClick={handleClick}>Botão</Button>)
    
    const button = screen.getByRole('button', { name: /botão/i })
    await userEvent.click(button)
    
    expect(clicked).toBe(true)
  })

  it('deve estar desabilitado quando disabled=true', () => {
    render(<Button disabled>Desabilitado</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('não deve chamar onClick quando desabilitado', async () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    
    render(<Button disabled onClick={handleClick}>Botão</Button>)
    
    const button = screen.getByRole('button')
    await userEvent.click(button)
    
    expect(clicked).toBe(false)
  })
})
