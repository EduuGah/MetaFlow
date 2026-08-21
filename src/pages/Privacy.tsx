import DocumentPage, { DocSection, Placeholder } from '../components/DocumentPage';
import { useSeo } from '../lib/seo';

/**
 * Este texto descreve apenas o que o código realmente faz — nada foi inferido
 * nem preenchido por conveniência. Onde falta um dado que só o responsável
 * pelo produto tem (identificação, contato, foro), há uma marcação visível.
 * Antes de publicar, revise com apoio jurídico.
 */
export default function Privacy() {
  useSeo({
    path: '/privacidade',
    title: 'Política de Privacidade',
    description:
      'Quais dados o MetaFlow coleta, onde eles ficam, quem consegue acessá-los e como pedir a exclusão da conta.',
  });

  return (
    <DocumentPage
      eyebrow="Documento"
      title="Política de Privacidade"
      updatedAt="20 de agosto de 2026"
      intro="O MetaFlow guarda o mínimo necessário para funcionar: quem é você e o que você anotou. Abaixo está, em detalhe, o que isso significa na prática."
    >
      <DocSection title="Quem é o responsável pelos dados">
        <p>
          O controlador dos dados tratados por este serviço é{' '}
          <Placeholder>Carlos Eduardo da Silva de Oliveira</Placeholder>, que pode ser contatado pelo endereço{' '}
          <Placeholder>edugah1809@gmail.com</Placeholder>.
        </p>
      </DocSection>

      <DocSection title="Dados que o serviço recebe">
        <p>
          <strong className="text-fg">Identificação da conta.</strong> Ao entrar com o Google, o MetaFlow recebe do
          provedor um identificador de usuário, o endereço de e-mail e o nome associado à conta. Nenhuma senha é
          criada, transmitida ou armazenada por este serviço.
        </p>
        <p>
          <strong className="text-fg">Conteúdo que você cria.</strong> Títulos, descrições, áreas, prazos, tarefas,
          subtarefas, prioridades, configurações de repetição e as datas em que cada item foi concluído.
        </p>
        <p>
          <strong className="text-fg">Registros técnicos.</strong> A infraestrutura de hospedagem e o banco de dados
          mantêm registros de acesso próprios (endereço IP, horário e tipo de requisição), conforme as políticas dos
          respectivos fornecedores.
        </p>
        <p>
          O MetaFlow não coleta dados de navegação para publicidade, não usa cookies de rastreamento e não possui
          ferramenta de analytics instalada.
        </p>
      </DocSection>

      <DocSection title="Onde os dados ficam">
        <p>
          Em um banco PostgreSQL gerenciado pelo <strong className="text-fg">Supabase</strong>. A separação entre
          contas é feita por políticas de Row Level Security no próprio banco: cada consulta só enxerga as linhas
          pertencentes ao usuário autenticado, independentemente do que o aplicativo peça.
        </p>
      </DocSection>

      <DocSection title="O que fica guardado no seu navegador">
        <p>
          A sessão autenticada é mantida no <span className="font-mono text-fg">localStorage</span> do navegador para
          que você não precise entrar de novo a cada visita. Além disso, o Service Worker do aplicativo guarda os
          arquivos da interface para que ela abra rapidamente e funcione mesmo sem conexão.
        </p>
        <p>
          Nenhum desses itens é cookie de publicidade ou de análise de comportamento. Sair da conta remove a sessão
          armazenada.
        </p>
      </DocSection>

      <DocSection title="Compartilhamento">
        <p>
          Seus dados não são vendidos nem cedidos a terceiros. Eles são processados apenas pelos fornecedores
          necessários para o serviço existir: o Google (autenticação), o Supabase (banco de dados e autenticação) e o
          provedor de hospedagem da aplicação.
        </p>
      </DocSection>

      <DocSection title="Por quanto tempo">
        <p>
          Os dados permanecem enquanto a conta existir. Ao excluir um projeto, ele e suas tarefas são removidos do
          banco imediatamente, sem lixeira e sem possibilidade de recuperação pela interface.
        </p>
      </DocSection>

      <DocSection title="Seus direitos">
        <p>
          A Lei Geral de Proteção de Dados (Lei nº 13.709/2018) garante a você, entre outros, os direitos de
          confirmar a existência de tratamento, acessar seus dados, corrigi-los, solicitar a portabilidade e pedir a
          eliminação dos dados tratados com base no consentimento.
        </p>
        <p>
          Correção e exclusão de conteúdo podem ser feitas diretamente no painel. Para exportação, exclusão completa
          da conta ou qualquer outra solicitação, escreva para <Placeholder>edugah1809@gmail.com</Placeholder>.
        </p>
      </DocSection>

      <DocSection title="Alterações neste documento">
        <p>
          Mudanças relevantes serão publicadas nesta página com nova data de atualização. Se a alteração exigir
          consentimento novo, ele será solicitado no próximo acesso.
        </p>
      </DocSection>
    </DocumentPage>
  );
}
