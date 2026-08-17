import { createClient } from 'npm:@supabase/supabase-js@^2';
import { corsHeaders } from 'npm:@supabase/supabase-js@^2/cors';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get(
  'SUPABASE_SERVICE_ROLE_KEY'
) ?? '';

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        error: 'Méthode non autorisée',
      },
      405
    );
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      {
        error:
          'Variables Supabase serveur manquantes',
      },
      500
    );
  }

  try {
    const authorization =
      req.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) {
      return jsonResponse(
        {
          error: 'Authentification requise',
        },
        401
      );
    }

    const accessToken = authorization.replace(
      'Bearer ',
      ''
    );

    const userClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: userData,
      error: userError,
    } = await userClient.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return jsonResponse(
        {
          error: 'Session utilisateur invalide',
        },
        401
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'list';

    if (action === 'list') {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`,
        {
          method: 'GET',
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return jsonResponse(
          {
            error: result,
          },
          response.status
        );
      }

      return jsonResponse(result);
    }

    if (action === 'update_status') {
      const leadId = body?.id;
      const status = body?.status;

      const allowedStatuses = [
        'new',
        'contacted',
        'qualified',
        'rejected',
        'converted',
      ];

      if (!leadId || !status) {
        return jsonResponse(
          {
            error: 'id et status sont obligatoires',
          },
          400
        );
      }

      if (!allowedStatuses.includes(status)) {
        return jsonResponse(
          {
            error: 'Statut invalide',
          },
          400
        );
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(
          leadId
        )}`,
        {
          method: 'PATCH',
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return jsonResponse(
          {
            error: result,
          },
          response.status
        );
      }

      if (!Array.isArray(result) || result.length === 0) {
        return jsonResponse(
          {
            error: 'Lead introuvable',
          },
          404
        );
      }

      return jsonResponse({
        success: true,
        lead: result[0],
      });
    }

    return jsonResponse(
      {
        error: 'Action inconnue',
      },
      400
    );
  } catch (error) {
    console.error('Erreur admin-leads :', error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur interne',
      },
      500
    );
  }
});