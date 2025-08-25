import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Loader2, Search, Upload, Download, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import './App.css'

function App() {
  const [cep, setCep] = useState('')
  const [cepData, setCepData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [processedData, setProcessedData] = useState(null)
  const [processingExcel, setProcessingExcel] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalCeps, setTotalCeps] = useState(0)

  // Função para validar CEP
  const validateCep = (cep) => {
    const cleanCep = cep.replace(/\D/g, '')
    return cleanCep.length === 8
  }

  // Função para formatar CEP
  const formatCep = (value) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return value
  }

  // Função para consultar CEP na API
  const fetchCepData = async (cep) => {
    try {
      const cleanCep = cep.replace(/\D/g, '')
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        return {
          cep: cleanCep,
          logradouro: 'CEP não encontrado',
          bairro: '',
          localidade: '',
          uf: '',
          complemento: '',
          erro: true
        }
      }
      
      return {
        cep: data.cep,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || '',
        complemento: data.complemento || '',
        erro: false
      }
    } catch (err) {
      return {
        cep: cep,
        logradouro: 'Erro na consulta',
        bairro: '',
        localidade: '',
        uf: '',
        complemento: '',
        erro: true
      }
    }
  }

  // Função para consultar CEP individual
  const consultarCep = async () => {
    if (!validateCep(cep)) {
      setError('CEP deve conter 8 dígitos')
      return
    }

    setLoading(true)
    setError('')
    setCepData(null)

    try {
      const data = await fetchCepData(cep)
      if (data.erro && data.logradouro === 'CEP não encontrado') {
        setError('CEP não encontrado')
      } else if (data.erro) {
        setError('Erro ao consultar CEP. Verifique sua conexão.')
      } else {
        setCepData(data)
      }
    } catch (err) {
      setError('Erro ao consultar CEP. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  // Função para lidar com mudança no input de CEP
  const handleCepChange = (e) => {
    const formatted = formatCep(e.target.value)
    setCep(formatted)
    setError('')
  }

  // Função para lidar com upload de arquivo Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx'))) {
      setExcelFile(file)
      setError('')
      setProcessedData(null)
    } else {
      setError('Por favor, selecione um arquivo Excel (.xlsx)')
    }
  }

  // Função para processar arquivo Excel
  const processExcelFile = async () => {
    if (!excelFile) return

    setProcessingExcel(true)
    setError('')
    setProgress(0)

    try {
      const data = await excelFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      if (jsonData.length === 0) {
        setError('O arquivo Excel está vazio')
        setProcessingExcel(false)
        return
      }

      // Encontrar a coluna que contém CEPs
      const headers = jsonData[0]
      let cepColumnIndex = -1

      // Procurar por uma coluna que contenha "cep" no nome
      for (let i = 0; i < headers.length; i++) {
        if (headers[i] && headers[i].toString().toLowerCase().includes('cep')) {
          cepColumnIndex = i
          break
        }
      }

      // Se não encontrar, usar a primeira coluna
      if (cepColumnIndex === -1) {
        cepColumnIndex = 0
      }

      // Extrair CEPs (pular a primeira linha se for cabeçalho)
      const startRow = headers.some(h => h && h.toString().toLowerCase().includes('cep')) ? 1 : 0
      const ceps = jsonData.slice(startRow)
        .map(row => row[cepColumnIndex])
        .filter(cep => cep && cep.toString().trim() !== '')
        .map(cep => cep.toString().replace(/\D/g, ''))
        .filter(cep => cep.length === 8)

      if (ceps.length === 0) {
        setError('Nenhum CEP válido encontrado no arquivo')
        setProcessingExcel(false)
        return
      }

      setTotalCeps(ceps.length)

      // Processar CEPs em lotes para evitar sobrecarga da API
      const results = []
      const batchSize = 5
      
      for (let i = 0; i < ceps.length; i += batchSize) {
        const batch = ceps.slice(i, i + batchSize)
        const batchPromises = batch.map(cep => fetchCepData(cep))
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
        
        setProgress(Math.round((results.length / ceps.length) * 100))
        
        // Pequena pausa entre lotes para não sobrecarregar a API
        if (i + batchSize < ceps.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Preparar dados para download
      const processedResults = results.map((result, index) => ({
        'CEP_Original': ceps[index],
        'CEP': result.cep,
        'Logradouro': result.logradouro,
        'Bairro': result.bairro,
        'Cidade': result.localidade,
        'Estado': result.uf,
        'Complemento': result.complemento,
        'Status': result.erro ? 'Erro' : 'Sucesso'
      }))

      setProcessedData(processedResults)

    } catch (err) {
      setError('Erro ao processar arquivo Excel: ' + err.message)
    } finally {
      setProcessingExcel(false)
      setProgress(0)
    }
  }

  // Função para download do Excel processado
  const downloadExcel = () => {
    if (!processedData) return

    const ws = XLSX.utils.json_to_sheet(processedData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'CEPs Processados')
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    saveAs(data, 'ceps_processados.xlsx')
  }

  // Função para download do CSV
  const downloadCSV = () => {
    if (!processedData) return

    const ws = XLSX.utils.json_to_sheet(processedData)
    const csv = XLSX.utils.sheet_to_csv(ws)
    
    const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(data, 'ceps_processados.csv')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Consulta CEP</h1>
          <p className="text-gray-600">Consulte CEPs individualmente ou em lote usando a API ViaCEP</p>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Consulta Individual</TabsTrigger>
            <TabsTrigger value="batch">Consulta em Lote</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Consulta Individual de CEP
                </CardTitle>
                <CardDescription>
                  Digite um CEP para obter informações de endereço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      value={cep}
                      onChange={handleCepChange}
                      maxLength={9}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={consultarCep} 
                      disabled={loading || !cep}
                      className="min-w-[100px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {cepData && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800">Resultado da Consulta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">CEP</Label>
                          <p className="text-gray-900">{cepData.cep}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Logradouro</Label>
                          <p className="text-gray-900">{cepData.logradouro || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Bairro</Label>
                          <p className="text-gray-900">{cepData.bairro || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Cidade</Label>
                          <p className="text-gray-900">{cepData.localidade || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Estado</Label>
                          <p className="text-gray-900">{cepData.uf || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Complemento</Label>
                          <p className="text-gray-900">{cepData.complemento || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Consulta em Lote
                </CardTitle>
                <CardDescription>
                  Faça upload de um arquivo Excel (.xlsx) com CEPs para processamento em lote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">Arquivo Excel</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    O arquivo deve conter uma coluna com CEPs. Formatos aceitos: .xlsx
                  </p>
                </div>

                {excelFile && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Arquivo selecionado:</strong> {excelFile.name}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Tamanho: {(excelFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <Button 
                  onClick={processExcelFile}
                  disabled={!excelFile || processingExcel}
                  className="w-full"
                >
                  {processingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando CEPs...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Processar CEPs
                    </>
                  )}
                </Button>

                {processingExcel && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Processando CEPs...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                    {totalCeps > 0 && (
                      <p className="text-sm text-gray-500 text-center">
                        Total de CEPs: {totalCeps}
                      </p>
                    )}
                  </div>
                )}

                {processedData && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Processamento Concluído
                      </CardTitle>
                      <CardDescription>
                        {processedData.length} CEPs processados com sucesso
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-green-700">Sucessos</p>
                            <p className="text-2xl font-bold text-green-800">
                              {processedData.filter(item => item.Status === 'Sucesso').length}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-red-700">Erros</p>
                            <p className="text-2xl font-bold text-red-800">
                              {processedData.filter(item => item.Status === 'Erro').length}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={downloadExcel} className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download Excel
                          </Button>
                          <Button onClick={downloadCSV} variant="outline" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                          </Button>
                        </div>

                        <div className="max-h-60 overflow-y-auto border rounded">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left">CEP</th>
                                <th className="px-3 py-2 text-left">Logradouro</th>
                                <th className="px-3 py-2 text-left">Cidade</th>
                                <th className="px-3 py-2 text-left">UF</th>
                                <th className="px-3 py-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {processedData.slice(0, 10).map((item, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-3 py-2">{item.CEP}</td>
                                  <td className="px-3 py-2">{item.Logradouro}</td>
                                  <td className="px-3 py-2">{item.Cidade}</td>
                                  <td className="px-3 py-2">{item.Estado}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      item.Status === 'Sucesso' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.Status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {processedData.length > 10 && (
                            <div className="p-3 text-center text-gray-500 text-sm border-t">
                              Mostrando 10 de {processedData.length} resultados. 
                              Faça o download para ver todos.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App

