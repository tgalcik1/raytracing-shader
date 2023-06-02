#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

const float infinity = 9999.99;
const vec3 background = vec3(0.5, 0.8, 1);

struct Ray{
    vec3 origin;
    vec3 dir;
};

struct Material{
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float specPow;
};

struct Light{
    float intensity;
    vec3 pos;
    vec3 color;
};

struct Sphere{
    vec3 pos;
    float radius;
    Material mat;
};

float intersectSphere(Ray ray, Sphere sphere){
    float a = dot(ray.dir, ray.dir);
    vec3 g = ray.origin - sphere.pos;
    float b = dot(ray.dir, g);
    float c = dot(g,g) - (sphere.radius * sphere.radius);
    
    float discriminant = b*b - a*c;
    if (discriminant < 0.0) return infinity;
    
    float dsq = sqrt(discriminant);
    float t = (-b - dsq) / a;    // first intersection test
    if (t > 0.0001) return t;
    
    t = (-b + dsq) / a;
    if (t > 0.0001) return t;
    
    return infinity;
}

vec3 Trace(Ray ray){
    
    // hardcoded scene
    Material mat;
    mat.ambient = vec3(0, 0, 0);
    mat.diffuse = vec3(1, 0, 0);
    mat.specular = vec3(0.5, 0.5, 0.5);
    mat.specPow = 20.0;
    
    Sphere sphere;
    sphere.pos = vec3(5,sin(u_time) + 5.0,0);
    sphere.radius = 2.0;
    sphere.mat = mat;
    
    Light light;
    light.intensity = 1.0;
    light.pos = vec3(7.5, 10, -10);
    light.color = vec3(1,1,1);
    // end hardcoded scene
    
    vec3 color = vec3(0,0,0);	// starting color
    
    float t = intersectSphere(ray,sphere);
    // no intersection, return background color
    if (t == infinity){
        return background;   
    }
    
    // for O in objects:
    	// for L in lights:
    
    vec3 P = ray.origin + (ray.dir * t);
    vec3 N = normalize(P - sphere.pos);
    vec3 L = normalize(light.pos - P);
    
    float N_dot_L = dot(N,L);
    
    if(N_dot_L >= 0.0){
        // phong shading
        float I_l = light.intensity;
		float lamb_ref = max(0.0, N_dot_L);
		color += sphere.mat.diffuse * I_l * lamb_ref;
        
        // specular highlights
        vec3 H = normalize(L - ray.dir);
		float N_dot_H = dot(N, H);
		if (N_dot_H > 0.0) {
			vec3 spec = sphere.mat.specular * I_l * pow(N_dot_H, sphere.mat.specPow) * N_dot_H;
			color += spec;
		}
    }
    
    color += sphere.mat.ambient * light.color;
    
    return color;
}

void main() {
    // uv coords
    vec2 tc = gl_FragCoord.xy/u_resolution.xy;
    
    // camera vars
    float fov = 0.2;
    vec3 eyep = vec3(0, 10, -50);
    vec3 lookp = vec3(0, 0, 0);
    vec3 cameraDir = normalize(lookp - eyep);
    
    // ray starts at eye pos and goes through current uv coord
    Ray ray;
    ray.origin = eyep;
    ray.dir = normalize(cameraDir + vec3(tc,0) * fov);
    
    // cast the ray
    vec3 color = Trace(ray);

    // final color
    gl_FragColor = vec4(color, 1.0);
}