<?php
/**
 Author: Kenneth Emeka Odoh
 */
require '../vendor/autoload.php';

// Database information
$settings = array (
		'driver' => 'mysql',
		'host' => '127.0.0.1',
		'port' => '3306',
		'database' => 'todo',
		'username' => 'root',
		'password' => 'root',
		'charset' => 'utf8',
		'collation' => 'utf8_unicode_ci',
		'prefix' => '' 
);

// Bootstrap Eloquent ORM

$container = new Illuminate\Container\Container ();
$connFactory = new \Illuminate\Database\Connectors\ConnectionFactory ( $container );
$conn = $connFactory->make ( $settings );
$resolver = new \Illuminate\Database\ConnectionResolver ();
$resolver->addConnection ( 'default', $conn );
$resolver->setDefaultConnection ( 'default' );
\Illuminate\Database\Eloquent\Model::setConnectionResolver ( $resolver );
class Book extends \Illuminate\Database\Eloquent\Model {
	protected $table = 'books';
	protected $fillable = array (
			'text',
			'active',
			'score' 
	);
}

$app = new Slim\App ();

/*************************************************************************************
 * API currently in use
 * 
 *************************************************************************************/

$app->post ( '/api/add', function ($request, $response) {
	/**
	 * add a new todo item in the database
	 */
	
	$data = $request->getParsedBody ();
	
	$text = filter_var ( $data ['text'], FILTER_SANITIZE_STRING );
	
	$active = filter_var ( $data ['active'], FILTER_SANITIZE_NUMBER_INT );
	$active = intval ( $active );
	
	$score = filter_var ( $data ['score'], FILTER_SANITIZE_NUMBER_INT );
	$score = intval ( $score );
	
	try {
		// Or create a new book
		$book = new \Book ( array (
				'text' => $text,
				'active' => intval ( $active ),
				'score' => intval ( $score ) 
		) );
		
		$book->save ();
	} catch ( Exception $e ) {
		$response->write ( '{"error":{"text":' . 'Unable to get the web service. ' . $e->getMessage () . '}}' );
	}
	
	return $response->withHeader ( 'Content-type', 'application/json' )->write ( $book->toJson () );
} );

$app->get ( '/api/show', function () {
	
	// Fetch all todo lists
	try {
		$books = \Book::all ();
		echo $books->toJson ();
	} catch ( Exception $e ) {
		echo '{"error":{"text":' . 'Unable to get the web service. ' . $e->getMessage () . '}}';
	}
} );

$app->post ( '/api/text/update/text/', function ($request, $response) {
	/**
	 * update the text in the html
	 */
	// curl -i -d "id=1&text=John" http://localhost:8000/api/text/update/text/
	
	$data = $request->getParsedBody ();
	$id = filter_var ( $data ['id'], FILTER_SANITIZE_NUMBER_INT );
	$id = intval ( $id );
	
	$text = filter_var ( $data ['text'], FILTER_SANITIZE_STRING );
	
	\Book::where ( 'id', $id )->update ( [ 
			'text' => $text 
	] );
	
	return $response->withHeader ( 'Content-type', 'application/json' )->write ( json_encode ( array (
			'message' => "text is updated" 
	) ) );
} );

$app->post ( '/api/text/update/active/', function ($request, $response) {
	// curl -i -d "id=1&active=10" http://localhost:8000/api/text/update/active/
	
	$data = $request->getParsedBody ();
	$id = filter_var ( $data ['id'], FILTER_SANITIZE_NUMBER_INT );
	$id = intval ( $id );
	
	$active = filter_var ( $data ['active'], FILTER_SANITIZE_NUMBER_INT );
	$active = intval ( $active );
	
	\Book::where ( 'id', $id )->update ( [ 
			'active' => $active 
	] );
	
	return $response->withHeader ( 'Content-type', 'application/json' )->write ( json_encode ( array (
			'message' => "active is updated" 
	) ) );
} );

$app->post ( '/api/text/delete/', function ($request, $response) {
	// curl -i -d "id=5" http://localhost:8000/api/text/delete/
	$data = $request->getParsedBody ();
	
	$id = filter_var ( $data ['id'], FILTER_SANITIZE_NUMBER_INT );
	$id = intval ( $id );
	
	$info = "";
	
	$books = \Book::where ( 'id', $id );
	
	if ($books->delete ()) {
		$info = "Successfully delete object";
	} else {
		$info = "Failed to delete user";
	}
	
	return $response->withHeader ( 'Content-type', 'application/json' )->write ( json_encode ( array (
			'message' => $info 
	) ) );
} );

$app->get ( '/api/summary', function ($query) {
	$active = \Book::where ( 'active', 1 )->count ();
	$notactive = \Book::where ( 'active', 0 )->count ();
	
	$output = array (
			"active" => $active,
			"notactive" => $notactive 
	);
	echo json_encode ( $output );
} );


/*************************************************************************************
* API not currently in use, but reserved for future development
*
*************************************************************************************/

$app->post ( '/api/text/update/score/', function ($request, $response) {
	// curl -i -d "id=1&score=10" http://localhost:8000/api/text/update/active/
	
	$data = $request->getParsedBody ();
	$id = filter_var ( $data ['id'], FILTER_SANITIZE_NUMBER_INT );
	$id = intval ( $id );
	
	$score = filter_var ( $data ['score'], FILTER_SANITIZE_NUMBER_INT );
	$score = intval ( score );
	
	\Book::where ( 'id', $id )->update ( [ 
			'score' => $score 
	] );
	
	return $response->withHeader ( 'Content-type', 'application/json' )->write ( json_encode ( array (
			'message' => "score is updated" 
	) ) );
} );

$app->get ( '/api/text/search/{query}', function ($request, $response, $args) {
	
	$query = $args ['query'];
	echo \Book::where ( 'active', '=', $query )->get ()->toJson ();
} );

$app->run ();
