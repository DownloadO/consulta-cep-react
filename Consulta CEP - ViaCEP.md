# Consulta CEP - ViaCEP

Uma aplicação React moderna para consulta de CEPs brasileiros usando a API pública ViaCEP.

## 🚀 Funcionalidades

- **Consulta Individual**: Digite um CEP e obtenha informações completas de endereço
- **Consulta em Lote**: Faça upload de um arquivo Excel (.xlsx) com múltiplos CEPs
- **Processamento Inteligente**: Processa CEPs em lotes para otimizar performance
- **Download de Resultados**: Baixe os resultados em formato Excel ou CSV
- **Tratamento de Erros**: Validação de CEPs e tratamento de erros da API
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- **Feedback Visual**: Indicadores de carregamento e progresso

## 🛠️ Tecnologias Utilizadas

- **React 19** - Framework JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de interface
- **SheetJS (xlsx)** - Manipulação de arquivos Excel
- **file-saver** - Download de arquivos
- **Lucide React** - Ícones
- **Vite** - Build tool e servidor de desenvolvimento

## 📋 Como Usar

### Consulta Individual

1. Acesse a aba "Consulta Individual"
2. Digite um CEP válido no formato 00000-000
3. Clique em "Buscar"
4. Visualize as informações de endereço retornadas

### Consulta em Lote

1. Acesse a aba "Consulta em Lote"
2. Prepare um arquivo Excel (.xlsx) com uma coluna contendo CEPs
   - A coluna pode ter qualquer nome que contenha "CEP"
   - Se não houver cabeçalho, a primeira coluna será usada
3. Faça upload do arquivo
4. Clique em "Processar CEPs"
5. Acompanhe o progresso do processamento
6. Baixe os resultados em Excel ou CSV

### Formato do Arquivo Excel

O arquivo Excel deve conter uma coluna com CEPs. Exemplo:

```
CEP
01310-100
20040-020
30112-000
40070-110
50030-230
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ 
- pnpm (recomendado) ou npm

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Entre no diretório
cd cep-consulta

# Instale as dependências
pnpm install

# Inicie o servidor de desenvolvimento
pnpm run dev
```

A aplicação estará disponível em `http://localhost:5173`

### Build para Produção

```bash
# Gerar build de produção
pnpm run build

# Visualizar build localmente
pnpm run preview
```

## 📊 Estrutura dos Dados Retornados

Para cada CEP processado, a aplicação retorna:

- **CEP_Original**: CEP enviado originalmente
- **CEP**: CEP formatado retornado pela API
- **Logradouro**: Nome da rua/avenida
- **Bairro**: Nome do bairro
- **Cidade**: Nome da cidade
- **Estado**: Sigla do estado (UF)
- **Complemento**: Informações complementares
- **Status**: "Sucesso" ou "Erro"

## 🔧 Configurações

A aplicação utiliza a API pública ViaCEP:
- **URL Base**: `https://viacep.com.br/ws/{CEP}/json/`
- **Rate Limit**: Processamento em lotes de 5 CEPs com pausa de 500ms
- **Timeout**: Sem timeout específico (usa padrão do fetch)

## 🎨 Interface

- **Design Responsivo**: Adaptado para desktop, tablet e mobile
- **Tema Moderno**: Gradiente azul com componentes shadcn/ui
- **Feedback Visual**: Indicadores de carregamento e progresso
- **Tratamento de Erros**: Alertas visuais para erros e validações

## 📝 Limitações

- Aceita apenas arquivos Excel (.xlsx)
- Processa CEPs em lotes para evitar sobrecarga da API
- Depende da disponibilidade da API ViaCEP
- CEPs devem ter 8 dígitos numéricos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🔗 Links Úteis

- [API ViaCEP](https://viacep.com.br/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

