import React, { useState, useEffect } from 'react';
import './PeriodicityForm.css';

export type PeriodicityPayload = {
  frequencyType: "ONCE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  weekDays?: string[];    // ex: ["MONDAY", "TUESDAY"]
  time?: string;          // "HH:mm"
  startDate?: string;     // "YYYY-MM-DD"
  endDate?: string | null;
};

interface PeriodicityFormProps {
  onSubmit?: (payload: PeriodicityPayload) => void;
  initialData?: Partial<PeriodicityPayload>;
  embedded?: boolean; // Se true, remove form wrapper e botão de submit (para usar dentro de outro form)
}

const WEEK_DAYS = [
  { id: "MONDAY", label: "Seg" },
  { id: "TUESDAY", label: "Ter" },
  { id: "WEDNESDAY", label: "Qua" },
  { id: "THURSDAY", label: "Qui" },
  { id: "FRIDAY", label: "Sex" },
  { id: "SATURDAY", label: "Sáb" },
  { id: "SUNDAY", label: "Dom" },
];

const FREQUENCY_TYPES = [
  { value: "ONCE", label: "Única" },
  { value: "DAILY", label: "Diária" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "BIWEEKLY", label: "Quinzenal" },
  { value: "MONTHLY", label: "Mensal" },
];

const PeriodicityForm: React.FC<PeriodicityFormProps> = ({ onSubmit, initialData, embedded = false }) => {
  console.log('PeriodicityForm renderizou', { embedded, initialData });
  
  const [frequencyType, setFrequencyType] = useState<"ONCE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY">(
    initialData?.frequencyType || "WEEKLY"
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(initialData?.weekDays || []);
  const [time, setTime] = useState<string>(initialData?.time || "08:00");
  const [startDate, setStartDate] = useState<string>(initialData?.startDate || "");
  const [endDate, setEndDate] = useState<string | null>(initialData?.endDate || null);
  const [noEndDate, setNoEndDate] = useState<boolean>(!initialData?.endDate);

  // Atualiza o estado quando initialData mudar
  useEffect(() => {
    if (initialData) {
      if (initialData.frequencyType) setFrequencyType(initialData.frequencyType);
      if (initialData.weekDays) setSelectedDays(initialData.weekDays);
      if (initialData.time) setTime(initialData.time);
      if (initialData.startDate) setStartDate(initialData.startDate);
      if (initialData.endDate !== undefined) {
        setEndDate(initialData.endDate);
        setNoEndDate(initialData.endDate === null);
      }
    }
  }, [initialData]);

  // Quando embedded, chama onSubmit automaticamente quando os dados mudarem (com debounce)
  useEffect(() => {
    if (!embedded || !onSubmit) return;
    
    // Não chama se não tiver horário
    if (!time) return;
    
    // Para WEEKLY e BIWEEKLY, só chama se tiver dias selecionados
    if ((frequencyType === "WEEKLY" || frequencyType === "BIWEEKLY") && selectedDays.length === 0) {
      return;
    }
    
    const payload: PeriodicityPayload = {
      frequencyType,
      weekDays: (frequencyType === "WEEKLY" || frequencyType === "BIWEEKLY") ? selectedDays : [],
      time,
      startDate: startDate || undefined,
      endDate: noEndDate ? null : (endDate || null),
    };
    
    // Usa setTimeout para evitar múltiplas chamadas rápidas
    const timeoutId = setTimeout(() => {
      if (onSubmit) {
        onSubmit(payload);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedded, frequencyType, selectedDays, time, startDate, endDate, noEndDate]);

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId].sort();
      }
    });
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const getSummary = (): string => {
    let summary = "";
    
    if (frequencyType === "ONCE") {
      summary = `Execução única`;
    } else if (frequencyType === "DAILY") {
      summary = `Diariamente`;
    } else if (frequencyType === "WEEKLY") {
      if (selectedDays.length === 0) {
        summary = `Semanalmente (selecione os dias)`;
      } else {
        const dayLabels = selectedDays
          .map(dayId => WEEK_DAYS.find(d => d.id === dayId)?.label)
          .filter(Boolean)
          .join(", ");
        summary = `Toda(s) ${dayLabels}`;
      }
    } else if (frequencyType === "BIWEEKLY") {
      if (selectedDays.length === 0) {
        summary = `Quinzenalmente (selecione os dias)`;
      } else {
        const dayLabels = selectedDays
          .map(dayId => WEEK_DAYS.find(d => d.id === dayId)?.label)
          .filter(Boolean)
          .join(", ");
        summary = `Quinzenalmente: ${dayLabels}`;
      }
    } else if (frequencyType === "MONTHLY") {
      summary = `Mensalmente`;
    }

    // Horário
    if (time) {
      summary += ` às ${time}`;
    }

    // Data de início
    if (startDate) {
      summary += `, a partir de ${formatDate(startDate)}`;
    }

    // Data de término
    if (!noEndDate && endDate) {
      summary += ` até ${formatDate(endDate)}`;
    } else if (noEndDate) {
      summary += ` (sem data de término)`;
    }

    return summary || "Configure a periodicidade";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!time) {
      alert("Selecione um horário.");
      return;
    }

    if ((frequencyType === "WEEKLY" || frequencyType === "BIWEEKLY") && selectedDays.length === 0) {
      alert("Selecione pelo menos um dia da semana.");
      return;
    }

    // Monta o payload
    const payload: PeriodicityPayload = {
      frequencyType,
      weekDays: (frequencyType === "WEEKLY" || frequencyType === "BIWEEKLY") ? selectedDays : [],
      time,
      startDate: startDate || undefined,
      endDate: noEndDate ? null : (endDate || null),
    };

    // Chama o callback ou faz console.log
    if (onSubmit) {
      onSubmit(payload);
    } else {
      console.log("PeriodicityPayload:", payload);
    }
  };

  // Sempre renderiza o conteúdo - nunca retorna null
  const formContent = (
    <div style={{ width: '100%' }}>
        {/* Tipo de periodicidade */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="frequencyType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Tipo de periodicidade *
          </label>
          <select
            id="frequencyType"
            value={frequencyType}
            onChange={(e) => setFrequencyType(e.target.value as "ONCE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY")}
            className="form-control"
            style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
          >
            {FREQUENCY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de dias da semana (para WEEKLY e BIWEEKLY) */}
        {(frequencyType === "WEEKLY" || frequencyType === "BIWEEKLY") && (
          <div className="form-group">
            <label>{frequencyType === "BIWEEKLY" ? "Dias da quinzena *" : "Dias da semana *"}</label>
            <div className="weekdays-container">
              {WEEK_DAYS.map(day => (
                <button
                  key={day.id}
                  type="button"
                  className={`day-button ${selectedDays.includes(day.id) ? "active" : ""}`}
                  onClick={() => handleDayToggle(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <small className="text-danger">Selecione pelo menos um dia da semana</small>
            )}
          </div>
        )}

        {/* Horário */}
        <div className="form-group">
          <label htmlFor="time">Horário *</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="form-control"
            required
          />
        </div>

        {/* Data de início */}
        <div className="form-group">
          <label htmlFor="startDate">Data de início</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-control"
          />
        </div>

        {/* Data de término */}
        <div className="form-group">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="noEndDate"
              checked={noEndDate}
              onChange={(e) => {
                setNoEndDate(e.target.checked);
                if (e.target.checked) {
                  setEndDate(null);
                }
              }}
            />
            <label htmlFor="noEndDate">Sem data de término</label>
          </div>
          {!noEndDate && (
            <input
              type="date"
              id="endDate"
              value={endDate || ""}
              onChange={(e) => setEndDate(e.target.value || null)}
              className="form-control"
              style={{ marginTop: "0.5rem" }}
            />
          )}
        </div>

        {/* Resumo */}
        <div className="summary-box">
          <strong>Resumo:</strong>
          <p>{getSummary()}</p>
        </div>

        {/* Botão de salvar - apenas se não estiver embedded */}
        {!embedded && (
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Salvar periodicidade
            </button>
          </div>
        )}
    </div>
  );

  // Quando embedded, não usa form wrapper (já está dentro de um form)
  // Mas sempre renderiza o conteúdo - NUNCA retorna null
  if (embedded) {
    return (
      <div
        className="periodicity-form"
        style={{
          width: '100%',
          display: 'block',
          visibility: 'visible',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
        }}
      >
        {formContent}
      </div>
    );
  }

  // Quando não embedded, usa form wrapper próprio
  return (
    <div className="periodicity-form">
      <form onSubmit={handleSubmit}>
        {formContent}
      </form>
    </div>
  );
};

export default PeriodicityForm;

