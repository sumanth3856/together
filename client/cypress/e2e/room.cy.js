describe('Room Interaction', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('can create a room, join, and send a chat message', () => {
    // 1. Create a room from landing page
    cy.contains('Start Watching').click()
    cy.contains('Join or Create Room').should('be.visible')
    
    // Fill in nickname
    cy.get('input[placeholder="Enter Nickname"]').type('Cypress User')
    cy.contains('Create Room').click()
    
    // 2. Wait for navigation to /room/id
    cy.url().should('include', '/room/')
    
    // 3. Verify room UI elements
    cy.contains('Cypress User').should('be.visible') // Avatar in MemberList or Header
    cy.contains('Leave Room').should('be.visible')
    
    // 4. Send a chat message
    cy.get('input[placeholder="Type a message..."]').type('Hello from Cypress!{enter}')
    
    // 5. Verify message is in chat
    cy.contains('Hello from Cypress!').should('be.visible')
    
    // 6. Test Demo Presets
    cy.contains('Lofi Girl').click()
    
    // 7. Test Leave Room
    cy.contains('Leave Room').click()
    
    // Confirm modal
    cy.contains('Yes, leave room').click()
    
    // Should be back at landing
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })
})
