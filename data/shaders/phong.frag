#version 330

//varyings and out color
in vec2 v_uv;
in vec3 v_normal;
in vec3 v_light_dir;
in vec3 v_cam_dir;
in vec3 v_vertex_world_pos;
out vec4 fragColor;

//basic material uniforms
uniform vec3 u_ambient;
uniform vec3 u_diffuse;
uniform vec3 u_specular;
uniform float u_specular_gloss;

//texture uniforms
uniform int u_use_diffuse_map;
uniform sampler2D u_diffuse_map;

//light structs and uniforms
struct PointLight {
	vec3 position;
	vec3 color;
	vec3 direction;
	int type;
	float linear_att;
	float quadratic_att;
	float spot_inner_cosine;
	float spot_outer_cosine;


};
const int MAX_LIGHTS = 8;
uniform PointLight lights[MAX_LIGHTS];
uniform int u_num_lights;


void main(){

	vec3 mat_diffuse = u_diffuse; //colour from uniform
	//multiply by texture if present
	if (u_use_diffuse_map != 0)
		mat_diffuse = mat_diffuse * texture(u_diffuse_map, v_uv).xyz;

	//ambient light
	vec3 final_color = u_ambient * mat_diffuse;
	
    
	//loop lights
	for (int i = 0; i < u_num_lights; i++){

		float attenuation = 1.0;
		float spot_cone_intensity = 1.0;
		//vec3 L = normalize(lights[i].position - v_vertex_world_pos); //direction to light
		
		vec3 L = normalize(-lights[i].direction );

		vec3 N = normalize(v_normal); //normal
		vec3 R = reflect(-L,N); //reflection vector
		vec3 V = normalize(v_cam_dir); //to camera
        
	if(lights[i].type > 0){ //if either point or spot
			vec3 point_to_light = normalize(lights[i].position - v_vertex_world_pos);
			L = normalize(point_to_light);
			if(lights[i].type == 2){ //if spot
			 spot_cone_intensity = 0.0;
				vec3 D = normalize(lights[i].direction);
				float cos_theta = dot(D,-L);
				if(cos_theta > lights[i].spot_inner_cosine)
					spot_cone_intensity = 1.0;
					
			}


			float dist = length(point_to_light);

			attenuation = 1 / (1.0 + (lights[i].linear_att * dist) + (lights[i].quadratic_att * dist * dist));
		}
		//diffuse color
		float NdotL = max(0.0, dot(N, L));
		vec3 diffuse_color = NdotL * mat_diffuse * lights[i].color;
							 
		//specular color
		float RdotV = max(0.0, dot(R, V)); //calculate dot product
		RdotV = pow(RdotV, u_specular_gloss); //raise to power for glossiness effect
		vec3 specular_color = RdotV * lights[i].color * u_specular;

		//final color
        final_color += (diffuse_color + specular_color) * attenuation * spot_cone_intensity;
	}

	fragColor = vec4(final_color, 1.0);
}
