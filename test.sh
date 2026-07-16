#!/bin/bash

# Número de execuções (padrão: 5)
RUNS=${1:-5}
PASSED=0
FAILED=0

echo "Iniciando a execução da suíte de testes $RUNS vezes para checar estabilidade..."
echo "Aguarde, isso pode demorar um pouco."

mkdir -p test-logs

for ((i=1; i<=RUNS; i++))
do
  echo "----------------------------------------"
  echo "Execução $i de $RUNS..."
  
  # Define o nome do arquivo de log
  LOG_FILE="test-logs/run_$i.log"
  
  # Executa os testes e redireciona a saída para o log
  if npm run docker:test:up > "$LOG_FILE" 2>&1; then
    echo "Execução $i: PASSOU"
    ((PASSED++))
    # Remove o log se passou para economizar espaço, se quiser manter mude aqui
    rm "$LOG_FILE" 
  else
    echo "Execução $i: FALHOU (verifique o arquivo de log em $LOG_FILE)"
    ((FAILED++))
  fi
done

echo "========================================"
echo "📊 Resumo das Execuções:"
echo "Total de Execuções: $RUNS"
echo "Passaram: $PASSED"
echo "Falharam: $FAILED"

if [ $FAILED -gt 0 ]; then
  echo "Alguns testes falharam. Verifique os logs na pasta 'test-logs'."
  exit 1
else
  echo "Todos os testes passaram."
  exit 0
fi
