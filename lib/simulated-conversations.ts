// Scripted conversations replayed by the "Simular conversación" button in the
// broker chat. Nothing here is sent to the broker: each turn types the user
// prompt, shows the orchestration indicator for `thinkMs`, then renders the
// markdown reply.

export interface SimulatedTurn {
  prompt: string;
  reply: string;
  /** How long the broker appears to be working before replying. */
  thinkMs: number;
}

export const SIMULATED_CONVERSATIONS: Record<string, SimulatedTurn[]> = {
  "conserje-digital-huesped": [
    {
      prompt:
        "Para la reserva IBS-7741203 del Iberostar Selection Paraíso Maya, del 12 al 19 de diciembre de 2026, apunta llegada a las 23:30 con cuna, dime qué upgrades hay por menos de 100 USD por noche y qué documentos faltan para el check-in online.",
      thinkMs: 16000,
      reply: `Resumen y acciones realizadas para IBS-7741203 (Iberostar Selection Paraíso Maya, 12–19 dic 2026):

1.  Confirmación de preferencias guardadas
    *   Llegada estimada registrada: 23:30.
    *   Solicitud de cuna: registrada.
2.  Upgrades disponibles < 100 USD/noche
    *   Suite Swim‑Up: +95 USD por noche. Suplemento total para 7 noches: 95 × 7 = 665 USD. (El agente indicó esta opción disponible.)
3.  Check-in online — documentos pendientes
    *   Estado: check-in online pendiente.
    *   Documento faltante: pasaporte del menor (niño de 4 años).
    *   Llave digital: no emitida (ya que el check-in online está incompleto).

¿Quiere que reserve ya el upgrade Suite Swim‑Up por +95 USD/noche? ¿Desea que le ayude a completar el check-in online si me facilita ahora el pasaporte del menor (foto/escaneo o datos: tipo de documento, número, país expedidor y fecha de caducidad) o prefiere que le indique el enlace/forma de carga segura? Si quiere, también puedo comprobar disponibilidad y confirmar la reserva del upgrade ahora.`,
    },
    {
      prompt: "si, haz una reserva a esa habitación con ese precio",
      thinkMs: 11000,
      reply: `Perfecto. He confirmado el upgrade a **Suite Swim-Up** para su reserva en Iberostar Selection Paraíso Maya.

**Detalles de la reserva actualizada**

*   **Número de reserva:** IBS-7741203
*   **Hotel:** Iberostar Selection Paraíso Maya
*   **Fechas:** 12 al 19 de diciembre de 2026 (7 noches)
*   **Nueva habitación:** Suite Swim-Up
*   **Suplemento:** 95 USD por noche
*   **Total adicional:** 665 USD

También se mantienen las preferencias registradas: **llegada estimada a las 23:30 y solicitud de cuna**.

El upgrade ha quedado asociado a su reserva. El importe adicional de 665 USD queda pendiente de pago, sujeto a las condiciones de la reserva.

**Check-in online:** sigue pendiente porque falta el pasaporte del menor de 4 años. La llave digital todavía no está disponible.

¿Desea que le indique cómo cargar el pasaporte de forma segura para completar el check-in online?`,
    },
    {
      prompt: "si, por favor",
      thinkMs: 9000,
      reply: `¡Por supuesto! Le ayudaré a completar el check-in online de su reserva **IBS-7741203** en Iberostar Selection Paraíso Maya.

Según el estado de su reserva, únicamente queda pendiente el **pasaporte del menor de 4 años**.

Para facilitarle el proceso de forma segura, le recomiendo:

1.  Acceder a la página oficial de Iberostar.
2.  Entrar en el apartado de gestión de reservas o check-in online.
3.  Identificar su reserva con el localizador **IBS-7741203** y los datos del titular.
4.  Acceder a la documentación de los huéspedes y completar los datos del pasaporte del menor.
5.  Guardar los cambios y comprobar que el check-in figura como completado.

Por seguridad, no es necesario que me envíe fotografías del pasaporte ni su número por este chat.

Puede acceder desde este enlace oficial:

[Gestionar reserva y acceder al check-in online de Iberostar](https://www.iberostar.com/area-privada/sin-login/new/)

Una vez completada la documentación, el hotel podrá validar el registro. A su llegada, podrá dirigirse al mostrador de check-in prioritario para recoger la llave de la habitación.

**Estado actual de su reserva:** Suite Swim-Up asignada, llegada prevista a las 23:30, cuna solicitada y check-in online pendiente de documentación.`,
    },
  ],
};
