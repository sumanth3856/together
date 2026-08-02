describe('Together Watch Party App', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('loads the landing page successfully', () => {
    cy.contains('Together').should('be.visible')
    cy.contains('Start Watching').should('be.visible')
    cy.contains('Watch Together').should('be.visible')
    cy.contains('Feel Together').should('be.visible')
  })

  it('can open the Join/Create Room modal', () => {
    cy.contains('Start Watching').click()
    cy.contains('Join or Create Room').should('be.visible')
    cy.get('input[placeholder="Enter Nickname"]').should('be.visible')
  })

  it('shows error if trying to join without nickname', () => {
    cy.contains('Start Watching').click()
    cy.contains('Join Room').click()
    cy.contains('Nickname is required').should('be.visible')
  })

  it('allows navigation through the bottom mobile tabs in mobile viewport', () => {
    cy.viewport('iphone-xr')
    cy.contains('Start Watching').click()
    // It's just a basic layout check for now.
    cy.get('.panel-glass').should('be.visible')
  })
})
