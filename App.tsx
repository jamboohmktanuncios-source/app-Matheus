

import React, { useState, useCallback, useRef, PropsWithChildren } from 'react';
import { analyzeVideo, AnalysisResult } from './services/geminiService';
import { UploadIcon, LogoIcon, FileVideoIcon, HourglassIcon, SubjectIcon, SummaryIcon, TranscriptIcon, TopicIcon, CheckIcon } from './components/icons';

// --- Componentes de UI Internos ---

const SkeletonLoader = () => (
  <div className="space-y-8 animate-pulse p-4">
    <div className="space-y-3">
      <div className="h-5 w-1/3 bg-brand-dark rounded-lg"></div>
      <div className="h-4 w-full bg-brand-dark rounded-lg"></div>
    </div>
    <div className="space-y-3">
      <div className="h-5 w-1/4 bg-brand-dark rounded-lg"></div>
      <div className="h-4 w-5/6 bg-brand-dark rounded-lg"></div>
    </div>
    <div className="space-y-3">
      <div className="h-5 w-1/2 bg-brand-dark rounded-lg"></div>
      <div className="h-4 w-full bg-brand-dark rounded-lg"></div>
      <div className="h-4 w-full bg-brand-dark rounded-lg"></div>
    </div>
    <div className="space-y-3">
      <div className="h-5 w-1/3 bg-brand-dark rounded-lg"></div>
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 bg-brand-dark rounded-full"></div>
        <div className="h-4 w-1/2 bg-brand-dark rounded-lg"></div>
      </div>
       <div className="flex items-center gap-3">
        <div className="h-5 w-5 bg-brand-dark rounded-full"></div>
        <div className="h-4 w-3/4 bg-brand-dark rounded-lg"></div>
      </div>
    </div>
  </div>
);

// FIX: Updated component to correctly handle children prop using PropsWithChildren to resolve TypeScript error.
interface ResultSectionProps {
  icon: React.ReactNode;
  title: string;
}

const ResultSection = ({ icon, title, children }: PropsWithChildren<ResultSectionProps>) => (
  <div>
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <h3 className="text-lg font-semibold text-brand-light">{title}</h3>
    </div>
    <div className="pl-9 border-l border-brand-dark">{children}</div>
  </div>
);


const ResultDisplay = ({ result }: { result: AnalysisResult }) => (
  <div className="space-y-6">
    <ResultSection icon={<SubjectIcon className="w-6 h-6 text-brand-primary" />} title="Assunto Principal">
      <p className="text-brand-light/90">{result.assuntoPrincipal}</p>
    </ResultSection>
    <ResultSection icon={<SummaryIcon className="w-6 h-6 text-brand-primary" />} title="Resumo Conciso">
      <p className="text-brand-light/90">{result.resumo}</p>
    </ResultSection>
    <ResultSection icon={<TranscriptIcon className="w-6 h-6 text-brand-primary" />} title="Transcrição Visual Detalhada">
      <p className="text-brand-light/90 whitespace-pre-wrap">{result.transcricaoVisual}</p>
    </ResultSection>
    <ResultSection icon={<TopicIcon className="w-6 h-6 text-brand-primary" />} title="Tópicos Chave">
      <ul className="space-y-2">
        {result.topicosChave.map((topic, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon className="w-5 h-5 text-brand-primary mt-1 flex-shrink-0" />
            <span className="text-brand-light/90">{topic}</span>
          </li>
        ))}
      </ul>
    </ResultSection>
  </div>
);

// --- Componente Principal ---

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setAnalysisResult(null);
      setError(null);
    } else {
      setError('Por favor, selecione um arquivo de vídeo válido.');
      setVideoFile(null);
      setVideoUrl(null);
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!videoFile) {
      setError('Nenhum vídeo selecionado para análise.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeVideo(videoFile);
      setAnalysisResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setError(`Falha na análise: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [videoFile]);
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-brand-darkest text-brand-light font-sans">
      <div className="absolute inset-0 -z-10 h-full w-full bg-brand-darkest bg-[radial-gradient(100%_50%_at_50%_0%,rgba(29,29,71,0.4)_0,rgba(29,29,71,0)_50%,rgba(29,29,71,0)_100%)]"></div>
      
      <div className="relative flex flex-col items-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <header className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <LogoIcon className="w-10 h-10" />
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-light">
                SUPER Analisador
              </h1>
            </div>
            <p className="text-brand-light/70 text-md">
              Obtenha transcrições visuais, resumos e tópicos chave do seu vídeo com Gemini.
            </p>
          </header>

          <main className="grid grid-cols-1 md:grid-cols-2 md:gap-8 space-y-8 md:space-y-0">
            <div className="space-y-8 flex flex-col">
              <div className="bg-brand-dark/70 backdrop-blur-md border border-brand-dark rounded-2xl p-6 shadow-2xl">
                <h2 className="text-xl font-semibold mb-4 text-brand-light">1. Faça o Upload</h2>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={handleUploadClick}
                  className="w-full flex flex-col items-center justify-center px-6 py-10 border-2 border-dashed border-brand-dark rounded-xl hover:border-brand-primary hover:bg-brand-dark transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-darkest"
                >
                  <UploadIcon className="w-10 h-10 text-brand-light/50 mb-3" />
                  <span className="text-lg font-medium text-brand-light/90">Clique para selecionar um vídeo</span>
                  <span className="text-sm text-brand-light/50 mt-1">MP4, MOV, WebM, etc.</span>
                </button>
                {videoFile && (
                  <div className="mt-4 p-3 bg-brand-darkest/50 rounded-lg flex items-center gap-3">
                    <FileVideoIcon className="w-6 h-6 text-brand-primary flex-shrink-0"/>
                    <span className="text-brand-light font-mono text-sm truncate">{videoFile.name}</span>
                  </div>
                )}
              </div>

              {videoUrl && (
                <div className="bg-brand-dark/70 backdrop-blur-md border border-brand-dark rounded-2xl p-6 shadow-2xl flex-grow flex flex-col">
                  <h2 className="text-xl font-semibold mb-4 text-brand-light">2. Pré-visualização</h2>
                  <div className="mb-4 rounded-lg overflow-hidden flex-grow">
                    <video src={videoUrl} controls className="w-full h-full object-cover aspect-video bg-black"></video>
                  </div>
                  <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold bg-brand-primary text-brand-darkest rounded-lg hover:brightness-110 disabled:bg-brand-dark disabled:text-brand-light/50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/80 focus:ring-offset-2 focus:ring-offset-brand-darkest"
                  >
                    {isLoading ? (
                      <>
                        <HourglassIcon className="w-6 h-6 animate-spin" />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <LogoIcon className="w-6 h-6 text-brand-darkest" />
                        <span>Analisar Vídeo</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-brand-dark/70 backdrop-blur-md border border-brand-dark rounded-2xl p-6 shadow-2xl">
               <h2 className="text-xl font-semibold mb-4 text-brand-light">3. Resultado da Análise</h2>
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-center">
                    {error}
                  </div>
                )}
                <div className="mt-4">
                  {isLoading ? (
                    <SkeletonLoader />
                  ) : analysisResult ? (
                    <ResultDisplay result={analysisResult} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-brand-light/50 h-full min-h-[300px]">
                      <p>Sua análise aparecerá aqui.</p>
                    </div>
                  )}
                </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;