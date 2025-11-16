# ⌨️ Atalhos de Teclado

## Atalhos Disponíveis

| Tecla | Ação |
|-------|------|
| `Ctrl/Cmd + S` | Salvar poder na biblioteca |
| `Ctrl/Cmd + N` | Criar novo poder (resetar) |
| `Ctrl/Cmd + B` | Abrir biblioteca de poderes |
| `Ctrl/Cmd + E` | Adicionar novo efeito |
| `Ctrl/Cmd + M` | Adicionar modificação global |
| `Ctrl/Cmd + R` | Ver resumo do poder |
| `Esc` | Fechar modal aberto |
| `?` | Mostrar ajuda de atalhos |

## Notas

- Os atalhos com `Ctrl/Cmd + S`, `Ctrl/Cmd + N` e `Ctrl/Cmd + B` funcionam mesmo quando você está digitando em campos de texto
- `Esc` sempre fecha o modal que estiver aberto
- Pressione `?` a qualquer momento para ver a lista completa de atalhos
- No Mac, use `Cmd` ao invés de `Ctrl`

## Implementação

Os atalhos são implementados através do hook customizado `useKeyboardShortcuts` que:

1. ✅ Detecta combinações de teclas (Ctrl/Cmd, Shift, Alt)
2. ✅ Previne comportamento padrão do navegador
3. ✅ Respeita contexto (não interfere quando digitando, exceto atalhos específicos)
4. ✅ Suporta múltiplos atalhos simultaneamente
5. ✅ Funciona em todos os navegadores modernos

## Feedback Visual

- 🔴 Indicador pulsante no botão de atalhos (primeira visita)
- 📋 Modal com lista completa de atalhos
- 🎯 Tooltips nos botões do header
