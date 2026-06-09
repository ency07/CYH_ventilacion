"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWizardStore } from "@/lib/hooks/useWizardStore";
import { FlowCalculatorSchema } from "@/lib/validations/cotizacion.schema";
import { ENVIRONMENTS } from "@/lib/constants/wizard";
import { FlowInputs } from "@/types/wizard";
import { ArrowLeft, Cpu, Activity, Gauge } from "lucide-react";

// Micro-interaction: Smooth SCADA-like animated counter for flow metrics
const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    
    const duration = 400; // ms duration
    const stepTime = 16; // 60fps
    const steps = Math.ceil(duration / stepTime);
    const increment = (end - start) / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      start += increment;
      if (step >= steps) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(start));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{displayValue.toLocaleString()}</span>;
};

export default function StepFlowCalculator() {
  const { flowInputs, flowResult, setFlowInputs, setStep } = useWizardStore();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FlowInputs>({
    resolver: zodResolver(FlowCalculatorSchema),
    mode: "onChange",
    defaultValues: {
      length: flowInputs.length || undefined,
      width: flowInputs.width || undefined,
      height: flowInputs.height || undefined,
      environment: flowInputs.environment || "warehouse",
    },
  });

  const length = watch("length");
  const width = watch("width");
  const height = watch("height");
  const environment = watch("environment");

  // Instant pre-engineering estimation feedback when inputs are valid
  useEffect(() => {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);
    const env = environment;

    if (l > 0 && w > 0 && h > 0 && env) {
      if (
        l !== flowInputs.length ||
        w !== flowInputs.width ||
        h !== flowInputs.height ||
        env !== flowInputs.environment
      ) {
        setFlowInputs({ length: l, width: w, height: h, environment: env });
      }
    }
  }, [length, width, height, environment, flowInputs, setFlowInputs]);

  const onSubmit = (data: FlowInputs) => {
    setFlowInputs(data);
    setStep("teaser");
  };

  return (
    <div className="space-y-8">
      
      {/* Title Block */}
      <div className="space-y-2">
        <span className="font-mono text-xs text-text-muted tracking-widest uppercase">
          PASO 02A • CALCULADORA COMPUTACIONAL DE FLUJO
        </span>
        <h2 className="font-display text-3xl tracking-wide text-text-primary uppercase">
          Dimensione sus Instalaciones
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
          Especifique las medidas tridimensionales del inmueble y el sector industrial correspondiente para calcular los caudales necesarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Dimensions Form Panel */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="lg:col-span-3 space-y-6"
        >
          
          {/* Dimension Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Length */}
            <div className="space-y-2">
              <label htmlFor="length" className="block font-mono text-[10px] text-text-secondary tracking-wider uppercase font-semibold">
                LARGO TOTAL (M)
              </label>
              <Controller
                name="length"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    value={field.value ?? ""}
                    id="length"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-sm text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.length && (
                <span className="text-[10px] font-mono text-danger block">{errors.length.message}</span>
              )}
            </div>

            {/* Width */}
            <div className="space-y-2">
              <label htmlFor="width" className="block font-mono text-[10px] text-text-secondary tracking-wider uppercase font-semibold">
                ANCHO TOTAL (M)
              </label>
              <Controller
                name="width"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    value={field.value ?? ""}
                    id="width"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-sm text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.width && (
                <span className="text-[10px] font-mono text-danger block">{errors.width.message}</span>
              )}
            </div>

            {/* Height */}
            <div className="space-y-2">
              <label htmlFor="height" className="block font-mono text-[10px] text-text-secondary tracking-wider uppercase font-semibold">
                ALTURA DE TECHO (M)
              </label>
              <Controller
                name="height"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    value={field.value ?? ""}
                    id="height"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-bg-tertiary border border-border-subtle rounded-sm p-3 text-sm text-text-primary focus:border-accent-cyan focus:outline-none transition-all placeholder:text-text-muted"
                  />
                )}
              />
              {errors.height && (
                <span className="text-[10px] font-mono text-danger block">{errors.height.message}</span>
              )}
            </div>

          </div>

          {/* Environment Options Selector */}
          <div className="space-y-3">
            <span className="block font-mono text-[10px] text-text-secondary tracking-wider uppercase font-semibold">
              SECTOR / AMBIENTE OPERATIVO
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ENVIRONMENTS.map((env) => (
                <Controller
                  key={env.id}
                  name="environment"
                  control={control}
                  render={({ field }) => {
                    const isSelected = field.value === env.id;
                    return (
                      <div
                        onClick={() => field.onChange(env.id)}
                        className={`p-4 border rounded-sm cursor-pointer relative overflow-hidden transition-all ${
                          isSelected 
                            ? "border-accent-cyan/60 bg-bg-secondary/40 shadow-[0_0_10px_rgba(0,212,255,0.06)]" 
                            : "border-border-subtle bg-bg-secondary/15 hover:border-border-medium"
                        }`}
                      >
                        <h4 className="font-mono text-xs font-semibold text-text-primary">{env.name}</h4>
                        <span className="font-mono text-[9px] text-accent-cyan tracking-widest block mt-1 uppercase">
                          {env.renewalRange}
                        </span>
                        <p className="text-[10px] text-text-secondary leading-relaxed mt-2">
                          {env.description}
                        </p>
                      </div>
                    );
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-border-subtle flex justify-between">
            <button
              type="button"
              onClick={() => setStep("service")}
              className="px-6 py-3 border border-border-medium hover:border-text-primary text-text-secondary hover:text-text-primary font-mono text-xs tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              REGRESAR
            </button>
            
            <button
              type="submit"
              disabled={!isValid}
              className={`px-8 py-3 font-semibold text-xs tracking-wider uppercase rounded-sm transition-all flex items-center gap-2 ${
                isValid
                  ? "bg-accent-cyan hover:bg-accent-cyan/95 text-background shadow-[0_4px_12px_rgba(0,212,255,0.15)]"
                  : "bg-bg-tertiary text-text-muted border border-border-subtle cursor-not-allowed"
              }`}
            >
              PROCESAR CÁLCULOS
            </button>
          </div>

        </form>

        {/* Real-time Engineering Estimation Feedback Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-sm border border-border-subtle bg-bg-secondary/40 space-y-6 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent-cyan/20" />
            
            <div className="flex items-center gap-2.5">
              <Cpu className="h-5 w-5 text-accent-cyan" />
              <span className="font-mono text-[10px] text-accent-cyan tracking-widest uppercase font-semibold">
                PRE-INGENIERÍA PRELIMINAR
              </span>
            </div>

            {flowResult ? (
              <div className="space-y-6">
                
                {/* Counter displaying volumetric rate changes */}
                <div className="space-y-1 bg-bg-primary/50 p-4 border border-border-subtle/80 rounded-sm">
                  <span className="font-mono text-[9px] text-text-secondary tracking-widest uppercase block">
                    CAUDAL DE EXTRACCIÓN ESTIMADO
                  </span>
                  <div className="font-mono text-3xl font-bold text-accent-cyan tracking-tight flex items-baseline gap-1">
                    <AnimatedCounter value={flowResult.estimatedFlow} />
                    <span className="text-sm text-text-secondary font-sans font-normal">CFM</span>
                  </div>
                </div>

                <div className="space-y-4">
                  
                  {/* Volumetric Volume */}
                  <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                    <span className="font-mono text-[10px] text-text-secondary uppercase">VOLUMEN TOTAL</span>
                    <span className="font-mono text-xs font-semibold text-text-primary">
                      {flowResult.volume.toLocaleString()} m³
                    </span>
                  </div>

                  {/* Category Class */}
                  <div className="space-y-1 border-b border-border-subtle pb-2">
                    <span className="font-mono text-[10px] text-text-secondary uppercase block">CATEGORÍA DE FLUIDO</span>
                    <span className="font-mono text-[10px] font-semibold text-accent-cyan tracking-wider uppercase block">
                      {flowResult.category}
                    </span>
                  </div>

                  {/* Investment Tier */}
                  <div className="space-y-1 border-b border-border-subtle pb-2">
                    <span className="font-mono text-[10px] text-text-secondary uppercase block">TIPO DE INFRAESTRUCTURA</span>
                    <span className="font-sans text-xs font-semibold text-text-primary block">
                      {flowResult.investmentRange}
                    </span>
                  </div>

                  {/* Engineering Directive */}
                  <div className="space-y-1.5 pt-1">
                    <span className="font-mono text-[10px] text-text-secondary uppercase block">DIRECTIVA RECOMENDADA</span>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {flowResult.recommendation}
                    </p>
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-4 space-y-3">
                <Gauge className="h-8 w-8 text-text-muted animate-pulse" />
                <p className="text-[11px] text-text-secondary leading-relaxed max-w-[200px]">
                  Ingrese dimensiones válidas de largo, ancho y alto para activar la estimación digital.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
