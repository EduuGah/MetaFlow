import { describe, expect, it } from 'vitest';
import { parseMarkdownProject } from '../markdownImport';

/** Só os títulos, em árvore, para as asserções ficarem legíveis. */
const shape = (tasks: { title: string; children: unknown[] }[]): unknown =>
  tasks.map((t) => (t.children.length > 0 ? { [t.title]: shape(t.children as never) } : t.title));

describe('parseMarkdownProject', () => {
  it('usa o título único do topo como nome do projeto', () => {
    const plan = parseMarkdownProject(['# Silicon Soil', '## Mundo', '## Combate'].join('\n'));
    expect(plan.title).toBe('Silicon Soil');
    expect(shape(plan.tasks)).toEqual(['Mundo', 'Combate']);
  });

  it('não rouba um título quando há vários no mesmo nível', () => {
    const plan = parseMarkdownProject(['# Mundo', '# Combate'].join('\n'));
    expect(plan.title).toBeNull();
    expect(shape(plan.tasks)).toEqual(['Mundo', 'Combate']);
  });

  it('desce um degrau por nível de título', () => {
    const plan = parseMarkdownProject(['# Jogo', '## Mundo', '### História', '## Combate'].join('\n'));
    expect(shape(plan.tasks)).toEqual([{ Mundo: ['História'] }, 'Combate']);
  });

  it('põe o item de lista abaixo do título que o contém', () => {
    const plan = parseMarkdownProject(['# Jogo', '## Mundo', '* [ ] Definir biomas'].join('\n'));
    expect(shape(plan.tasks)).toEqual([{ Mundo: ['Definir biomas'] }]);
  });

  it('lê a caixa marcada como concluída', () => {
    const plan = parseMarkdownProject(['# Jogo', '## Mundo', '- [x] Feito', '- [ ] Pendente'].join('\n'));
    const mundo = plan.tasks[0];
    expect(mundo.children.map((c) => [c.title, c.done])).toEqual([
      ['Feito', true],
      ['Pendente', false],
    ]);
    expect(plan.done).toBe(1);
  });

  it('conta o recuo por comparação, aceitando 2 ou 4 espaços', () => {
    const doisEspacos = parseMarkdownProject(['# J', '## A', '* Pai', '  * Filho'].join('\n'));
    const quatroEspacos = parseMarkdownProject(['# J', '## A', '* Pai', '    * Filho'].join('\n'));
    expect(shape(doisEspacos.tasks)).toEqual([{ A: [{ Pai: ['Filho'] }] }]);
    expect(shape(quatroEspacos.tasks)).toEqual(shape(doisEspacos.tasks));
  });

  it('manda o que passa do terceiro nível para as anotações', () => {
    const plan = parseMarkdownProject(
      ['# J', '## Visão', '### Conceito', '* [ ] Definir gênero', '  * [ ] RPG?', '  * [ ] Soulslike?'].join('\n')
    );
    const conceito = plan.tasks[0].children[0];
    expect(conceito.title).toBe('Conceito');
    expect(conceito.children[0].title).toBe('Definir gênero');
    expect(conceito.children[0].notes).toEqual(['RPG?', 'Soulslike?']);
    expect(plan.warnings.join(' ')).toContain('2 itens');
  });

  /**
   * O caso que motivou a pilha de títulos: documento de assistente de conversa
   * que usa `#` para o nome e também para as seções, com uma seção em `##`.
   * A conta por número de `#` punha `### 1.2` dentro de `### 1.1`.
   */
  it('endireita documento com níveis de título desalinhados', () => {
    const plan = parseMarkdownProject(
      [
        '# Silicon Soil',
        '## 1. Visão central',
        '### 1.1 Conceito',
        '* [ ] Definir a premissa',
        '### 1.2 Pilares',
        '* [ ] Descoberta',
        '# 2. Construção do mundo',
        '## 2.1 História',
        '* [ ] Criar história real',
      ].join('\n')
    );

    expect(plan.title).toBe('Silicon Soil');
    expect(shape(plan.tasks)).toEqual([
      { '1. Visão central': [{ '1.1 Conceito': ['Definir a premissa'] }, { '1.2 Pilares': ['Descoberta'] }] },
      { '2. Construção do mundo': [{ '2.1 História': ['Criar história real'] }] },
    ]);
  });

  it('ignora prosa, tabela, citação e bloco de código', () => {
    const plan = parseMarkdownProject(
      [
        '# Jogo',
        '## Mundo',
        'Essa é a parte mais importante do projeto.',
        '| Tecnologia | Uso |',
        '| --- | --- |',
        '| IA | Oráculo |',
        '> Uma citação qualquer',
        '```text',
        '- isto está dentro de código',
        '```',
        '* [ ] Definir biomas',
      ].join('\n')
    );
    expect(shape(plan.tasks)).toEqual([{ Mundo: ['Definir biomas'] }]);
  });

  it('limpa a marcação do título', () => {
    const plan = parseMarkdownProject(['# J', '## A', '* **Descoberta** e `código`', '* [Link](http://x)'].join('\n'));
    expect(plan.tasks[0].children.map((c) => c.title)).toEqual(['Descoberta e código', 'Link']);
  });

  it('aceita lista numerada', () => {
    const plan = parseMarkdownProject(['# J', '## Pilares', '1. Descoberta', '2. Liberdade'].join('\n'));
    expect(shape(plan.tasks)).toEqual([{ Pilares: ['Descoberta', 'Liberdade'] }]);
  });

  it('avisa quando não encontra nada', () => {
    const plan = parseMarkdownProject('Só um parágrafo solto.');
    expect(plan.total).toBe(0);
    expect(plan.warnings.join(' ')).toContain('Nenhuma tarefa');
  });

  it('corta título acima do limite da coluna', () => {
    const longo = 'a'.repeat(300);
    const plan = parseMarkdownProject(`# J\n## ${longo}`);
    expect(plan.tasks[0].title).toHaveLength(160);
  });
});
