import pandas as pd

# Criar dados de exemplo
data = {
    'CEP': ['01310-100', '20040-020', '30112-000', '40070-110', '50030-230']
}

df = pd.DataFrame(data)
df.to_excel('exemplo_ceps.xlsx', index=False)
print("Arquivo Excel criado com sucesso!")

