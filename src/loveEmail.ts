const toneOpenings: Record<string, string> = {
  doce: "Meu amor,",
  saudoso: "Meu amor, hoje a saudade sentou do meu lado,",
  apaixonado: "Meu amor,",
  divertido: "Meu amor, estava pensando em voce e sorri sozinho,",
  poetico: "Meu amor, tem dias em que o mundo parece escrever seu nome nas pequenas coisas,",
};

export function buildLoveEmailBody(tone: string, context: string): string {
  const normalizedTone = tone.trim().toLowerCase();
  const opening = toneOpenings[normalizedTone] ?? toneOpenings.doce;
  const contextLine = context.trim()
    ? `Pensei especialmente nisto: ${context.trim()}`
    : "Pensei em tudo que a gente vem vivendo, nas pequenas cenas que ficam comigo depois que o dia passa.";

  return [
    opening,
    "",
    contextLine,
    "",
    "Queria te escrever com calma para lembrar que voce e uma das partes mais bonitas da minha vida. Gosto do jeito como sua presenca muda o peso das horas, como uma conversa simples com voce consegue deixar o dia mais leve, e como ate os planos pequenos ficam maiores quando imagino nos dois juntos.",
    "",
    "Obrigado por ser carinho, abrigo, riso e vontade de futuro. Eu te amo, e gosto de poder te escolher de novo em cada detalhe.",
    "",
    "Com todo meu amor,",
    "",
  ].join("\n");
}
