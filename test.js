
movie = ["spy","ray","spy","room","once","ray","spy","once"];
solution(movie);

function solution(movie) {
    var movieName = [];
    var movieCounts = [];
    var movieAnswer = [];
    
    
    for (var i in movie)
    {
        var idx = movie[i];
        movieName[idx] = movie[i];
        if(typeof(movieCounts[idx])=='undefined')  
        movieCounts[idx]=1;
        else
        movieCounts[idx]++;
    }    
    movieName = movieName.filter(function(){ return true});
    movieCounts = movieCounts.filter(function(){ return true});
    
    var movieObj=[];
    
    for(var i=0; i<movieName.length; i++)
    {
        movieObj.push({title:movieName[i],count:movieCounts[movieName]});
    }
    console.log(movieObj);
	return movieObj;
}