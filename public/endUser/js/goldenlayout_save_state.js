// JavaScript Document



var config = {
  content: [{
    type: 'row',
    content:[{
      type: 'component',
      componentName: 'testComponent',
      componentState: { label: 'A' }
    },{
      type: 'column',
      content:[{
        type: 'component',
        componentName: 'testComponent',
        componentState: { label: 'B' }
      },{
        type: 'component',
        componentName: 'testComponent',
        componentState: { label: 'C' }
      }]
    }]
  }]
};

var myLayout,
    savedState = localStorage.getItem( 'savedState' );

if( savedState !== null ) {
    myLayout = new GoldenLayout( JSON.parse( savedState ) );
} else {
    myLayout = new GoldenLayout( config );
}

myLayout.on( 'stateChanged', function(){
    var state = JSON.stringify( myLayout.toConfig() );
    localStorage.setItem( 'savedState', state );
});

var persistentComponent = function( container, state ){

  //Check for localStorage
  if( !typeof window.localStorage ) {
    container.getElement().append(  '<h2 class="err">Your browser doesn\'t support localStorage.</h2>');
    return;
  }
  
  // Create the input
  var input = $( '<input type="text" />' );

  // Set the initial / saved state
  if( state.label ) {
    input.val( state.label );
  }

  // Store state updates
  input.on( 'change', function(){
    container.setState({
      label: input.val()
    });
  }); 

  // Append it to the DOM
  container.getElement().append(  '<h2>I\'ll be saved to localStorage</h2>', input );
};

myLayout.registerComponent( 'testComponent', persistentComponent );
myLayout.init();

