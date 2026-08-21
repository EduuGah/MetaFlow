import DocumentPage, { DocSection, Placeholder } from '../components/DocumentPage';
import { useSeo } from '../lib/seo';

/**
 * Como na Política de Privacidade: só o que é verificável no próprio produto.
 * Cláusulas que dependem de decisão do responsável estão marcadas.
 */
export default function Terms() {
  useSeo({
    path: '/termos',
    title: 'Termos de uso',
    description: 'As regras de uso do MetaFlow: o que o serviço faz, o que se espera de quem usa e quais são os limites.',
  });

  return (
    <DocumentPage
      eyebrow="Documento"
      title="Termos de uso"
      updatedAt="20 de agosto de 2026"
      intro="Ao entrar no MetaFlow você concorda com as condições abaixo. Elas descrevem o que o serviço se compromete a fazer e o que se espera de quem usa."
    >
      <DocSection title="O que é o serviço">
        <p>
          O MetaFlow é um aplicativo web para organizar projetos pessoais em tarefas e subtarefas, com prazos,
          prioridades e repetição. Ele calcula o progresso a partir das tarefas concluídas e sincroniza o conteúdo
          entre os dispositivos em que você entrar com a mesma conta.
        </p>
      </DocSection>

      <DocSection title="Conta de acesso">
        <p>
          O acesso é feito exclusivamente pela sua conta Google. Você é responsável por manter essa conta segura: quem
          tiver acesso a ela terá acesso ao seu conteúdo no MetaFlow.
        </p>
      </DocSection>

      <DocSection title="Conteúdo que você cria">
        <p>
          O conteúdo dos seus projetos é seu. O serviço não reivindica direitos sobre ele e não o utiliza para
          nenhuma finalidade além de exibi-lo a você e mantê-lo salvo.
        </p>
        <p>
          Você é responsável pelo que registra. Não use o serviço para armazenar conteúdo ilegal, nem dados sensíveis
          de terceiros sem base legal para isso.
        </p>
      </DocSection>

      <DocSection title="Uso aceitável">
        <p>
          Não é permitido tentar acessar dados de outras contas, contornar os limites técnicos do serviço, automatizar
          requisições em volume que degrade a disponibilidade para outras pessoas, ou usar a infraestrutura para
          finalidade diferente da proposta.
        </p>
      </DocSection>

      <DocSection title="Disponibilidade e limitação de responsabilidade">
        <p>
          O serviço é fornecido no estado em que se encontra. Não há garantia de disponibilidade ininterrupta, e
          manutenções ou falhas de fornecedores externos podem torná-lo temporariamente inacessível.
        </p>
        <p>
          Não existe compromisso formal de nível de serviço nem rotina de backup restaurável pelo usuário. Se o seu
          conteúdo for crítico, mantenha uma cópia própria.
        </p>
        <p>
          A exclusão de um projeto é definitiva e não pode ser desfeita pela interface.
        </p>
      </DocSection>

      <DocSection title="Encerramento">
        <p>
          Você pode parar de usar o serviço quando quiser. Para excluir a conta e todo o conteúdo associado, escreva
          para <Placeholder>edugah1809@gmail.com</Placeholder>.
        </p>
        <p>
          O serviço pode encerrar contas que descumpram estes termos, com aviso prévio sempre que possível.
        </p>
      </DocSection>
    </DocumentPage>
  );
}
