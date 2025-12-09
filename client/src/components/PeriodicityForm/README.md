# PeriodicityForm Component

Componente React para configurar a periodicidade de uma tarefa/rota. O componente coleta os dados e monta um objeto JSON `PeriodicityPayload` que pode ser enviado ao backend.

## Uso Básico

```tsx
import PeriodicityForm, { PeriodicityPayload } from './components/PeriodicityForm';

function MyComponent() {
  const handlePeriodicitySubmit = (payload: PeriodicityPayload) => {
    console.log('Payload:', payload);
    // Enviar para o backend
    // apiService.post('/routes/periodicity', payload);
  };

  return (
    <PeriodicityForm onSubmit={handlePeriodicitySubmit} />
  );
}
```

## Props

### `onSubmit?: (payload: PeriodicityPayload) => void`
Callback opcional chamado quando o formulário é submetido. Recebe o objeto `PeriodicityPayload`.

### `initialData?: Partial<PeriodicityPayload>`
Dados iniciais opcionais para preencher o formulário (útil para edição).

## Tipo PeriodicityPayload

```typescript
type PeriodicityPayload = {
  frequencyType: "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY";
  weekDays?: string[];    // ex: ["MONDAY", "TUESDAY"]
  time?: string;          // "HH:mm"
  startDate?: string;     // "YYYY-MM-DD"
  endDate?: string | null;
};
```

## Exemplo Completo

```tsx
import React, { useState } from 'react';
import PeriodicityForm, { PeriodicityPayload } from './components/PeriodicityForm';

function RouteForm() {
  const [periodicityData, setPeriodicityData] = useState<PeriodicityPayload | null>(null);

  const handlePeriodicitySubmit = (payload: PeriodicityPayload) => {
    setPeriodicityData(payload);
    // Aqui você pode enviar para o backend
    console.log('Periodicidade configurada:', payload);
  };

  return (
    <div>
      <h2>Configurar Periodicidade</h2>
      <PeriodicityForm onSubmit={handlePeriodicitySubmit} />
      
      {periodicityData && (
        <div>
          <h3>Dados coletados:</h3>
          <pre>{JSON.stringify(periodicityData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

## Validações

O componente valida automaticamente:
- Horário é obrigatório
- Para tipo "WEEKLY", pelo menos um dia da semana deve ser selecionado

## Estilização

O componente inclui estilos CSS próprios. Você pode sobrescrever as classes CSS conforme necessário:
- `.periodicity-form`
- `.form-group`
- `.weekdays-container`
- `.day-button`
- `.summary-box`

